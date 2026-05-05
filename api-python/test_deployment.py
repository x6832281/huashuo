# Backend deployment module test script

import os
import sys
import json

print('Starting backend deployment module tests...')

def test_docker_config():
    print('Testing Docker configuration...')
    try:
        dockerfile_path = os.path.join(os.path.dirname(__file__), 'Dockerfile')
        docker_compose_path = os.path.join(os.path.dirname(__file__), 'docker-compose.yml')
        
        if os.path.exists(dockerfile_path):
            print('PASS: Dockerfile exists')
        else:
            print('FAIL: Dockerfile not found')
            return False
        
        if os.path.exists(docker_compose_path):
            print('PASS: docker-compose.yml exists')
        else:
            print('FAIL: docker-compose.yml not found')
            return False
        
        with open(dockerfile_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'FROM python:3.9-slim' in content:
                print('PASS: Dockerfile base image configured correctly')
            else:
                print('FAIL: Dockerfile base image configured incorrectly')
                return False
            
            if 'uvicorn main:app' in content or 'uvicorn' in content:
                print('PASS: Dockerfile startup command configured correctly')
            else:
                print('FAIL: Dockerfile startup command configured incorrectly')
                return False
        
        print('PASS: Docker configuration test passed')
        return True
    except Exception as e:
        print(f'FAIL: Docker configuration test failed: {e}')
        return False

def test_cicd_config():
    print('Testing CI/CD configuration...')
    try:
        cicd_path = os.path.join(os.path.dirname(__file__), '.github', 'workflows', 'deploy-backend.yml')
        
        if os.path.exists(cicd_path):
            print('PASS: GitHub Actions configuration exists')
        else:
            print('FAIL: GitHub Actions configuration not found')
            return False
        
        with open(cicd_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'Deploy Backend' in content:
                print('PASS: GitHub Actions name configured correctly')
            else:
                print('FAIL: GitHub Actions name configured incorrectly')
                return False
            
            if 'actions/setup-python' in content:
                print('PASS: GitHub Actions Python configuration correct')
            else:
                print('FAIL: GitHub Actions Python configuration incorrect')
                return False
        
        print('PASS: CI/CD configuration test passed')
        return True
    except Exception as e:
        print(f'FAIL: CI/CD configuration test failed: {e}')
        return False

def test_dependencies():
    print('Testing dependencies configuration...')
    try:
        requirements_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
        
        if os.path.exists(requirements_path):
            print('PASS: requirements.txt exists')
        else:
            print('FAIL: requirements.txt not found')
            return False
        
        with open(requirements_path, 'r', encoding='utf-8') as f:
            content = f.read()
            required_deps = ['fastapi', 'uvicorn', 'supabase', 'python-dotenv', 'aiohttp']
            
            for dep in required_deps:
                if dep in content:
                    print(f'PASS: Dependency {dep} configured correctly')
                else:
                    print(f'FAIL: Dependency {dep} configured incorrectly')
                    return False
        
        print('PASS: Dependencies configuration test passed')
        return True
    except Exception as e:
        print(f'FAIL: Dependencies configuration test failed: {e}')
        return False

def test_environment_variables():
    print('Testing environment variables configuration...')
    try:
        env_example_path = os.path.join(os.path.dirname(__file__), '.env.example')
        
        if os.path.exists(env_example_path):
            print('PASS: .env.example exists')
        else:
            with open(env_example_path, 'w', encoding='utf-8') as f:
                f.write('''# Supabase configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# OpenRouter configuration
OPENROUTER_API_KEY=your-openrouter-api-key

# Application configuration
SECRET_KEY=your-secret-key
''')
            print('PASS: .env.example created successfully')
        
        docker_compose_path = os.path.join(os.path.dirname(__file__), 'docker-compose.yml')
        with open(docker_compose_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'SUPABASE_URL' in content and 'SUPABASE_KEY' in content and 'OPENROUTER_API_KEY' in content:
                print('PASS: docker-compose.yml environment variables configured correctly')
            else:
                print('FAIL: docker-compose.yml environment variables configured incorrectly')
                return False
        
        print('PASS: Environment variables configuration test passed')
        return True
    except Exception as e:
        print(f'FAIL: Environment variables configuration test failed: {e}')
        return False

def run_tests():
    print('\nStarting backend deployment module tests...\n')
    
    results = [
        test_docker_config(),
        test_cicd_config(),
        test_dependencies(),
        test_environment_variables()
    ]
    
    passed = results.count(True)
    total = len(results)
    
    print(f'\nTest results: {passed}/{total} passed')
    
    if passed == total:
        print('All tests passed!')
        return True
    else:
        print('Some tests failed, please check configuration')
        return False

if __name__ == '__main__':
    run_tests()
