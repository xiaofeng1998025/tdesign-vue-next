import { isVue2 } from '@td/adapter-vue';
import type { ComponentMountingOptions } from '@vue/test-utils-vue3';
import * as Vu3Utils from '@vue/test-utils-vue3';
import * as Vu2Utils from '@vue/test-utils-vue2';

export function mount(inputComponent: any, options: ComponentMountingOptions<any> = {}) {
  let mount$ = Vu3Utils.mount;
  if (isVue2) {
    mount$ = Vu2Utils.mount as any;
    if (options.props) {
      options.propsData = options.props;
      delete options.props;
    }

    if (options.global) {
      Object.assign(options, options.global);
      delete options.global;
    }

    if (options.shallow === true) {
      mount$ = Vu2Utils.shallowMount as any;
    }
  }

  const wrapper = mount$(inputComponent, options);

  if (isVue2) {
    wrapper.unmount = (wrapper as any).destroy;
  }

  return wrapper;
}
