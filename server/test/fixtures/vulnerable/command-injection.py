import os
from flask import request

def ping_host():
    hostname = request.args.get('hostname')
    # QUERY_VULNERABILITY: command-injection
    os.system("ping " + hostname)
