import * as path from 'node:path';
import * as process from 'node:process';
import { searchForWorkspaceRoot } from 'vite';
import { basePlugin } from '../../../script/vite.base.config';
// import { resolveAlias } from '../../../../../sites/vue3/vite.config';

const workspaceRoot = searchForWorkspaceRoot(process.cwd());
const getRootPath = (...args: string[]) => path.posix.resolve(workspaceRoot, ...args);

export function resolveAlias(vueVersion: number) {
  return [
    { find: '@', replacement: path.resolve(__dirname) },
    { find: '@adapter/vue', replacement: getRootPath(`packages/adapter/vue/vue${vueVersion}`) },
    { find: '@adapter/hooks', replacement: getRootPath(`packages/adapter/hooks/vue${vueVersion}`) },
    { find: '@adapter/test-utils', replacement: getRootPath(`internal/vue-test-utils/vue${vueVersion}`) },
    { find: /^@td\/components\/(.+)/, replacement: getRootPath(`packages/tdesign-vue${vueVersion === 3 ? '-next' : ''}/src/$1`) },
    { find: /^@td\/components$/, replacement: getRootPath(`packages/tdesign-vue${vueVersion === 3 ? '-next' : ''}`) },
    { find: 'tdesign-vue-next/es/locale', replacement: getRootPath(`packages/components/locale/src`) },
  ];
}

// 单元测试相关配置
const testConfig = {
  include:
  // process.env.NODE_ENV === 'test-snap'
  //   ? ['test/unit/snap/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
       [`${getRootPath('packages/components/common/src')}/**/__tests__/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`],
  globals: true,
  environment: 'jsdom',
  testTimeout: 1000,
  setupFiles: process.env.NODE_ENV === 'test-snap' ? path.resolve(__dirname, './test-setup.js') : '',
  transformMode: {
    web: [/\.[jt]sx$/],
  },
  coverage: {
    reporter: ['text', 'json', 'html'],
  },
};

export default {
  resolve: { alias: resolveAlias(3) },
  plugins: [
    ...basePlugin,
    {
      transform(code: string, id: string) {
        if (id.endsWith('packages/adapter/vue/vue3/index.ts')) {
          return;
        }
        const REG = /import (.+)? from "vue";/g;
        code = code.replace(REG, ($0, $1) => {
          return `import ${$1} from "@td/adapter-vue";`;
        });

        return code;
      },
    },
  ],
  test: testConfig,
};
