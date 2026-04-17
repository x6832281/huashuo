// Domain configuration module test script

import domainConfig from '../config/domain_config.js';

console.log('Starting domain configuration module tests...');

function testGetConfig() {
  console.log('Testing get config...');
  const config = domainConfig.getConfig();
  console.log('Config:', config);
  console.assert(config !== null, 'Config should exist');
  console.assert(typeof config === 'object', 'Config should be an object');
  console.log('PASS: Get config test passed');
}

function testGetDomain() {
  console.log('Testing get domain...');
  const domain = domainConfig.getDomain();
  console.log('Domain:', domain);
  console.assert(domain !== null, 'Domain should exist');
  console.assert(typeof domain === 'string', 'Domain should be a string');
  console.log('PASS: Get domain test passed');
}

function testGetSubdomain() {
  console.log('Testing get subdomain...');
  const wwwDomain = domainConfig.getSubdomain('www');
  const apiDomain = domainConfig.getSubdomain('api');
  console.log('www subdomain:', wwwDomain);
  console.log('api subdomain:', apiDomain);
  console.assert(wwwDomain !== null, 'www subdomain should exist');
  console.assert(apiDomain !== null, 'api subdomain should exist');
  console.log('PASS: Get subdomain test passed');
}

function testGetSubdomains() {
  console.log('Testing get all subdomains...');
  const subdomains = domainConfig.getSubdomains();
  console.log('All subdomains:', subdomains);
  console.assert(subdomains !== null, 'Subdomains config should exist');
  console.assert(typeof subdomains === 'object', 'Subdomains config should be an object');
  console.log('PASS: Get all subdomains test passed');
}

function testGetDnsRecords() {
  console.log('Testing get DNS records...');
  const records = domainConfig.getDnsRecords();
  console.log('DNS records:', records);
  console.assert(records !== null, 'DNS records should exist');
  console.assert(Array.isArray(records), 'DNS records should be an array');
  console.log('PASS: Get DNS records test passed');
}

function testGetHttpsConfig() {
  console.log('Testing get HTTPS config...');
  const httpsConfig = domainConfig.getHttpsConfig();
  console.log('HTTPS config:', httpsConfig);
  console.assert(httpsConfig !== null, 'HTTPS config should exist');
  console.assert(typeof httpsConfig === 'object', 'HTTPS config should be an object');
  console.log('PASS: Get HTTPS config test passed');
}

function testGetDeploymentConfig() {
  console.log('Testing get deployment config...');
  const deploymentConfig = domainConfig.getDeploymentConfig();
  console.log('Deployment config:', deploymentConfig);
  console.assert(deploymentConfig !== null, 'Deployment config should exist');
  console.assert(typeof deploymentConfig === 'object', 'Deployment config should be an object');
  console.log('PASS: Get deployment config test passed');
}

function testValidateConfig() {
  console.log('Testing validate config...');
  const validation = domainConfig.validateConfig();
  console.log('Validation result:', validation);
  console.assert(validation !== null, 'Validation result should exist');
  console.assert(typeof validation === 'object', 'Validation result should be an object');
  console.log('PASS: Validate config test passed');
}

function testGenerateServiceConfig() {
  console.log('Testing generate service config...');
  const frontendConfig = domainConfig.generateServiceConfig('frontend');
  const backendConfig = domainConfig.generateServiceConfig('backend');
  console.log('Frontend service config:', frontendConfig);
  console.log('Backend service config:', backendConfig);
  console.assert(frontendConfig !== null, 'Frontend service config should exist');
  console.assert(backendConfig !== null, 'Backend service config should exist');
  console.log('PASS: Generate service config test passed');
}

function testGenerateDnsInstructions() {
  console.log('Testing generate DNS instructions...');
  const instructions = domainConfig.generateDnsInstructions();
  console.log('DNS instructions:', instructions);
  console.assert(instructions !== null, 'DNS instructions should exist');
  console.assert(typeof instructions === 'string', 'DNS instructions should be a string');
  console.log('PASS: Generate DNS instructions test passed');
}

function testGenerateHttpsInstructions() {
  console.log('Testing generate HTTPS instructions...');
  const instructions = domainConfig.generateHttpsInstructions();
  console.log('HTTPS instructions:', instructions);
  console.assert(instructions !== null, 'HTTPS instructions should exist');
  console.assert(typeof instructions === 'string', 'HTTPS instructions should be a string');
  console.log('PASS: Generate HTTPS instructions test passed');
}

function testGenerateDeploymentInstructions() {
  console.log('Testing generate deployment instructions...');
  const frontendInstructions = domainConfig.generateDeploymentInstructions('frontend');
  const backendInstructions = domainConfig.generateDeploymentInstructions('backend');
  console.log('Frontend deployment instructions:', frontendInstructions);
  console.log('Backend deployment instructions:', backendInstructions);
  console.assert(frontendInstructions !== null, 'Frontend deployment instructions should exist');
  console.assert(backendInstructions !== null, 'Backend deployment instructions should exist');
  console.log('PASS: Generate deployment instructions test passed');
}

function runTests() {
  console.log('\nStarting domain configuration module tests...\n');
  
  try {
    testGetConfig();
    testGetDomain();
    testGetSubdomain();
    testGetSubdomains();
    testGetDnsRecords();
    testGetHttpsConfig();
    testGetDeploymentConfig();
    testValidateConfig();
    testGenerateServiceConfig();
    testGenerateDnsInstructions();
    testGenerateHttpsInstructions();
    testGenerateDeploymentInstructions();
    
    console.log('\nAll tests passed!');
    return true;
  } catch (error) {
    console.error('\nTest failed:', error.message);
    return false;
  }
}

runTests();

export { runTests };