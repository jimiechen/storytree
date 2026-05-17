/**
 * TC-001: 配置加载测试
 */

import { loadConfig, validateConfig } from './.trae/skills/ralph-feishu-sync/lib/config';

console.log('🧪 TC-001: 配置加载测试\n');

// 测试配置加载
console.log('1️⃣ 测试 loadConfig()...');
const config = loadConfig();

console.log('✅ 配置加载成功');
console.log('   项目名:', config.project.name);
console.log('   项目ID:', config.project.id);
console.log('   飞书启用:', config.enabled);
console.log('   Git启用:', config.git.enabled);
console.log('   分支:', config.git.branch);

// 测试配置验证
console.log('\n2️⃣ 测试 validateConfig()...');
const validation = validateConfig(config);

console.log('✅ 配置验证完成');
console.log('   是否有效:', validation.valid);
console.log('   缺失项:', validation.missing.length > 0 ? validation.missing : '无');

// 详细配置输出
console.log('\n3️⃣ 完整配置信息:');
console.log(JSON.stringify(config, null, 2));

console.log('\n✅ TC-001 测试完成');
