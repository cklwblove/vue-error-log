import Vue from 'vue';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

function formatComponentName(vm) {
  if (vm.$root === vm) return 'root';

  const name = vm._isVue ? (vm.$options && vm.$options.name) || (vm.$options && vm.$options._componentTag) : vm.name;
  return (name ? 'component <' + name + '>' : 'anonymous component') + (vm._isVue && vm.$options && vm.$options.__file ? ' at ' + (vm.$options && vm.$options.__file) : '');
}

/**
 * Raven.js 日志记录插件
 * Doc:https://docs.sentry.io/clients/javascript/usage/
 * @param {Object} options
 */
export default function (options = {}) {
  if (!options.dsn) {
    console.warn('sentry dsn must be set value.');
    return;
  }

  Raven.config(options.dsn,
    {
      release: options.release
    })
    .addPlugin(RavenVue, Vue)
    .install();

  Raven.setUserContext({
    user: options.user || ''
  });

  Raven.setTagsContext({environment: options.env});

  // global error
  require('./core/globalLog');
  // vue errorHandler
  Vue.config.errorHandler = function (err, vm, info) {
    console.error('这里是errorHandler：' + err);
    const componentName = formatComponentName(vm);
    const propsData = vm.$options && vm.$options.propsData;

    Raven.captureException(err, {
      level: 'error',
      tags: {
        svn_commit: 'vue'
      },
      extra: {
        componentName: componentName,
        propsData: propsData,
        info: info
      }
    });
  };
  // 挂载到vue属性上
  Vue.prototype.$raven = Raven;
}