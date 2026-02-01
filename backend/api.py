import sys
import json
import logging
import subprocess
import re

# Configure logging to file since stdout is used for IPC
logging.basicConfig(filename='backend.log', level=logging.DEBUG)

def run_winget(args):
    """Run winget command and return output."""
    try:
        # Prevent console window from popping up
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        
        result = subprocess.run(
            ['winget'] + args,
            capture_output=True,
            text=True,
            startupinfo=startupinfo,
            encoding='utf-8' # Force utf-8 for special chars
        )
        return result
    except FileNotFoundError:
        return None

def run_winget_install(app_id):
    """Run winget install without capturing output so GUI can show."""
    try:
        # Don't hide the window for install - we want the user to see the installer
        result = subprocess.run(
            ['winget', 'install', '--id', app_id, '--interactive', 
             '--accept-source-agreements', '--accept-package-agreements'],
            capture_output=True,  # Still capture to get error messages
            text=True,
            encoding='utf-8',
            timeout=300  # 5 minute timeout
        )
        
        logging.info(f"Install command finished with code {result.returncode}")
        logging.info(f"Stdout: {result.stdout}")
        logging.info(f"Stderr: {result.stderr}")
        
        return result
    except subprocess.TimeoutExpired:
        logging.error("Install command timed out")
        return None
    except FileNotFoundError:
        logging.error("Winget not found")
        return None
    except Exception as e:
        logging.error(f"Install error: {e}")
        return None

def is_verified_app(source, app_id):
    """
    Determine if an app is verified based on source and ID.
    Returns dict with verified status and reason.
    
    Priority: Well-known publishers > MS Store
    (MS Store apps don't need our help anyway)
    """
    # Well-known publishers (based on ID prefix) - HIGHEST PRIORITY
    well_known = {
        'Microsoft.': 'Official Microsoft',
        'Google.': 'Official Google',
        'Mozilla.': 'Official Mozilla',
        'Adobe.': 'Official Adobe',
        'Apple.': 'Official Apple',
        'Valve.': 'Official Valve',
        'Oracle.': 'Official Oracle',
        'JetBrains.': 'Official JetBrains',
        'Spotify.': 'Official Spotify',
        'Discord.': 'Official Discord',
        'Zoom.': 'Official Zoom',
        'Slack.': 'Official Slack',
        'Notion.': 'Official Notion',
        'Brave.': 'Official Brave',
        'Telegram.': 'Official Telegram',
        'VideoLAN.': 'Official VideoLAN',
        'Git.': 'Official Git',
        'Python.': 'Official Python',
        'Node.': 'Official Node.js',
    }
    
    for prefix, reason in well_known.items():
        if app_id.startswith(prefix):
            return {'verified': True, 'reason': reason}
    
    # Microsoft Store apps (lower priority since they don't need our help)
    if source and 'msstore' in source.lower():
        return {'verified': True, 'reason': 'Microsoft Store'}
    
    return {'verified': False, 'reason': ''}

def get_app_homepage(app_id):
    """
    Get the homepage URL for an app using winget show.
    Returns the homepage URL or None.
    """
    try:
        result = run_winget(['show', app_id, '--accept-source-agreements'])
        if result and result.returncode == 0:
            # Parse the output for Homepage field
            for line in result.stdout.split('\n'):
                if 'Homepage:' in line or 'Publisher Url:' in line:
                    # Extract URL after the colon
                    url = line.split(':', 1)[1].strip()
                    if url and url.startswith('http'):
                        return url
        return None
    except Exception as e:
        logging.error(f"Error getting homepage for {app_id}: {e}")
        return None

def parse_search_results(output):
    """
    Parse winget search output into structured data.
    Extracts: Name, Id, Version, Source
    """
    apps = []
    lines = output.split('\n')
    found_header = False
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Find header line
        if not found_header:
            if 'Name' in line and 'Id' in line:
                found_header = True
                logging.debug(f"Found header at line {i}: {line}")
            continue
        
        # Skip separator lines
        if re.match(r'^-+\s+-+', line):
            continue
        
        # Parse data lines - split by 2+ spaces
        parts = re.split(r'\s{2,}', line)
        parts = [p.strip() for p in parts if p.strip()]
        
        if len(parts) >= 2:
            app = {
                'name': parts[0],
                'id': parts[1],
                'version': parts[2] if len(parts) > 2 else '',
                'source': parts[3] if len(parts) > 3 else 'winget'
            }
            
            # Add verification info
            verification = is_verified_app(app['source'], app['id'])
            app['verified'] = verification['verified']
            app['verificationReason'] = verification['reason']
            
            # Optionally get homepage (can be slow, so we'll do it on-demand)
            # app['homepage'] = get_app_homepage(app['id'])
            
            apps.append(app)
            logging.debug(f"Parsed app: {app}")
    
    return apps

def process_command(command):
    """Process incoming JSON commands."""
    try:
        cmd_type = command.get('type')
        
        if cmd_type == 'ping':
            return {'status': 'success', 'message': 'pong', 'data': command.get('data')}
        
        if cmd_type == 'search_app':
            query = command.get('query')
            logging.info(f"Searching for: {query}")
            
            # search --accept-source-agreements to avoid prompts
            result = run_winget(['search', query, '--accept-source-agreements'])
            
            if not result:
                return {'status': 'error', 'message': 'Winget not found'}
                
            if result.returncode != 0:
                return {'status': 'error', 'message': f"Winget error: {result.stderr}"}
            
            # Parse into structured data
            apps = parse_search_results(result.stdout)
            
            return {'status': 'success', 'apps': apps}
        
        if cmd_type == 'get_app_details':
            app_id = command.get('appId')
            logging.info(f"Getting details for: {app_id}")
            
            homepage = get_app_homepage(app_id)
            
            return {
                'status': 'success',
                'appId': app_id,
                'homepage': homepage
            }

        if cmd_type == 'install_app':
            app_id = command.get('appId')
            logging.info(f"Installing: {app_id}")
            
            result = run_winget_install(app_id)
            
            if result is None:
                return {'status': 'error', 'message': 'Winget not found or install timed out'}
                
            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
                
                # Check if app is already installed (this is actually a success case)
                if 'already installed' in error_msg.lower() or 'no available upgrade' in error_msg.lower():
                    return {
                        'status': 'success', 
                        'message': 'App is already installed and up to date',
                        'alreadyInstalled': True
                    }
                
                if not error_msg:
                    error_msg = f"Install failed with exit code {result.returncode}"
                return {'status': 'error', 'message': f"Install failed: {error_msg}"}
                 
            return {'status': 'success', 'message': 'Installation completed successfully', 'output': result.stdout}
        
        if cmd_type == 'chat_message':
            user_message = command.get('message', '')
            logging.info(f"Chat message: {user_message}")
            
            # Placeholder AI response - replace with actual LLM integration later
            responses = [
                "I'm a placeholder AI assistant. I can help you install apps using the App Installer page!",
                "That's interesting! Try navigating to the App Installer to search for and install applications.",
                "I'm here to help! Currently, I'm a simple placeholder. Real AI integration coming soon!",
                "You can use the App Installer to search for apps like Firefox, Chrome, or any other software available through winget."
            ]
            
            import random
            ai_response = random.choice(responses)
            
            return {
                'status': 'success',
                'type': 'chat',
                'message': ai_response
            }
            
        return {'status': 'error', 'message': 'Unknown command'}
    except Exception as e:
        logging.error(f"Error processing command: {e}")
        return {'status': 'error', 'message': str(e)}

def main():
    logging.info("Backend service started")
    while True:
        try:
            # Read line from stdin
            line = sys.stdin.readline()
            if not line:
                break
                
            line = line.strip()
            if not line:
                continue
                
            logging.debug(f"Received: {line}")
            
            # Parse JSON
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                print(json.dumps({'status': 'error', 'message': 'Invalid JSON'}))
                sys.stdout.flush()
                continue
                
            # Process
            response = process_command(data)
            
            # Send response
            print(json.dumps(response))
            sys.stdout.flush()
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            logging.critical(f"Fatal error: {e}")
            break

if __name__ == "__main__":
    main()
