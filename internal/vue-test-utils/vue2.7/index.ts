import type { ComponentMountingOptions } from '@vue/test-utils';
import * as Vu2Utils from '@vue/test-utils';

export function mount(inputComponent: any, options: ComponentMountingOptions<any> = {}) {
  let mount$ = Vu2Utils.mount as any;
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

  const wrapper = mount$(inputComponent, options);

  wrapper.unmount = (wrapper as any).destroy;

  return wrapper;
}
