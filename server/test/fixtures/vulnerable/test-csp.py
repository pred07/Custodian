# Test for Insecure CSP
# Should be detected by the new assignment-based analysis

def configure_security():
    # Vulnerable: Insecure CSP with unsafe-inline
    csp_header = "default-src 'self'; script-src 'self' 'unsafe-inline'"
    
    # Vulnerable: Insecure CSP with unsafe-eval
    policy = "script-src 'unsafe-eval'"
    
    # Vulnerable: Different variable name
    CONTENT_SECURITY_POLICY = "default-src *; script-src 'unsafe-inline'"

    return csp_header
