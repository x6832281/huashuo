// 前端部署模块测试脚本
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('开始测试前端部署模块...');

// 测试构建配置
function testBuildConfig() {
  console.log('测试构建配置...');
  try {
    const viteConfigPath = join(__dirname, '..', 'vite.config.js');
    const vercelConfigPath = join(__dirname, '..', 'vercel.json');
    const netlifyConfigPath = join(__dirname, '..', 'netlify.toml');
    const packageJsonPath = join(__dirname, '..', 'package.json');
    
    const files = [
      { name: 'vite.config.js', path: viteConfigPath },
      { name: 'vercel.json', path: vercelConfigPath },
      { name: 'netlify.toml', path: netlifyConfigPath },
      { name: 'package.json', path: packageJsonPath }
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        console.log(`✅ ${file.name} 存在`);
      } else {
        console.log(`❌ ${file.name} 不存在`);
        throw new Error(`${file.name} 不存在`);
      }
    });
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    if (scripts.dev && scripts.build && scripts.preview) {
      console.log('✅ package.json 脚本配置正确');
    } else {
      console.log('❌ package.json 脚本配置不完整');
      throw new Error('package.json 脚本配置不完整');
    }
    
    console.log('✅ 构建配置测试通过');
    return true;
  } catch (error) {
    console.error('❌ 构建配置测试失败:', error.message);
    return false;
  }
}

// 测试部署配置
function testDeploymentConfig() {
  console.log('测试部署配置...');
  try {
    const githubActionsPath = join(__dirname, '..', '.github', 'workflows', 'deploy.yml');
    
    if (fs.existsSync(githubActionsPath)) {
      console.log('✅ GitHub Actions 配置存在');
    } else {
      console.log('❌ GitHub Actions 配置不存在');
      throw new Error('GitHub Actions 配置不存在');
    }
    
    const manifestPath = join(__dirname, '..', 'manifest.json');
    const serviceWorkerPath = join(__dirname, '..', 'service-worker.js');
    
    if (fs.existsSync(manifestPath)) {
      console.log('✅ manifest.json 存在');
    } else {
      console.log('❌ manifest.json 不存在');
      throw new Error('manifest.json 不存在');
    }
    
    if (fs.existsSync(serviceWorkerPath)) {
      console.log('✅ service-worker.js 存在');
    } else {
      console.log('❌ service-worker.js 不存在');
      throw new Error('service-worker.js 不存在');
    }
    
    console.log('✅ 部署配置测试通过');
    return true;
  } catch (error) {
    console.error('❌ 部署配置测试失败:', error.message);
    return false;
  }
}

// 测试目录结构
function testDirectoryStructure() {
  console.log('测试目录结构...');
  try {
    const dirs = [
      { name: 'src', path: join(__dirname, '..', 'src') },
      { name: 'test', path: join(__dirname, '..', 'test') },
      { name: 'ug', path: join(__dirname, '..', 'ug') },
      { name: 'api', path: join(__dirname, '..', 'api') }
    ];
    
    dirs.forEach(dir => {
      if (fs.existsSync(dir.path) && fs.lstatSync(dir.path).isDirectory()) {
        console.log(`✅ ${dir.name} 目录存在`);
      } else {
        console.log(`❌ ${dir.name} 目录不存在`);
        throw new Error(`${dir.name} 目录不存在`);
      }
    });
    
    console.log('✅ 目录结构测试通过');
    return true;
  } catch (error) {
    console.error('❌ 目录结构测试失败:', error.message);
    return false;
  }
}

// 运行所有测试
function runTests() {
  console.log('\n开始测试前端部署模块...\n');
  
  const results = [
    testBuildConfig(),
    testDeploymentConfig(),
    testDirectoryStructure()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！');
    return true;
  } else {
    console.log('❌ 部分测试失败，请检查配置');
    return false;
  }
}

runTests();

export { runTests, testBuildConfig, testDeploymentConfig, testDirectoryStructure };