import os
import sys
import argparse
import yaml
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY not found in .env file.")
    sys.exit(1)

client = Groq(api_key=GROQ_API_KEY)

PROMPT_TEMPLATE = """
You are a security expert. Convert this CVE description into a vulnerability detection rule for a static analysis tool.

CVE Description:
{cve_description}

Output ONLY valid YAML matching this schema:
id: <unique-kebab-case-id>
name: <human-readable-name>
severity: <high|medium|low>
description: <one-sentence-explanation>
sinks: [<list-of-dangerous-function-names>]
sources: [<list-of-taint-sources-like-user-input>]
sanitizers: [<optional-list-of-cleaning-functions>]
confidence: experimental

Example:
id: sql-injection-django-raw
name: SQL Injection in Django raw()
severity: high
description: User input flows into raw SQL query
sinks: ["raw", "execute"]
sources: ["request.GET", "request.POST"]
confidence: experimental

Do not include markdown code blocks. Just the YAML.
"""

def generate_rule(cve_description):
    prompt = PROMPT_TEMPLATE.format(cve_description=cve_description)
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-70b-8192",
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        # Strip markdown code blocks if present
        if response_text.startswith("```yaml"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return response_text.strip()
        
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Generate security rules from CVE descriptions.")
    parser.add_argument("description", nargs="?", help="CVE description text")
    parser.add_argument("--file", help="Read description from file")
    
    args = parser.parse_args()
    
    description = ""
    if args.file:
        try:
            with open(args.file, 'r') as f:
                description = f.read()
        except FileNotFoundError:
            print(f"Error: File {args.file} not found.")
            sys.exit(1)
    elif args.description:
        description = args.description
    else:
        # Read from stdin
        if not sys.stdin.isatty():
            description = sys.stdin.read()
        else:
            parser.print_help()
            sys.exit(1)
            
    if not description:
        print("Error: Empty description.")
        sys.exit(1)
        
    print("Generating rule...")
    yaml_rule = generate_rule(description)
    
    if yaml_rule:
        try:
            # Validate YAML
            parsed = yaml.safe_load(yaml_rule)
            output_path = f"server/data/rules/experimental/{parsed['id']}.yml"
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'w') as f:
                f.write(yaml_rule)
                
            print(f"Success! Rule generated at: {output_path}")
            print(yaml_rule)
            
        except yaml.YAMLError as e:
            print("Error: Generated output is not valid YAML.")
            print(yaml_rule)
            print(e)
            
if __name__ == "__main__":
    main()
