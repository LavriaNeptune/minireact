// const element = (
//   <div id='foo'>
//     <a>bar</a>
//     <b />
//   </div>
// );

// ↓ 相当于使用 React.createElement ↓

// const element = React.createElement(
//   'div',
//   { id: 'foo' },
//   React.createElement('a', null, 'bar'),
//   React.createElement('b'),
// );

// ↓ 将 React.createElement 改写为原生 JS 的 createElement ↓

function createElement(type, props, ...children) {
  // 使用 rest parameter 将 children 转化为数组 -> 这样方便通过 map 方法遍历 children 了
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === 'object' ? child : createTextElement(child);
        // 如果 child 是字符串,则创建文本节点;如果 child 是对象,则直接返回
      }),
    },
  };
}
// 创建处理文字节点的函数 createTextElement()
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    // 为文字节点特设的类型
    props: {
      nodeValue: text,
      children: [],
      // 注意:React 不会包裹原始值,而是直接将原始值作为节点的属性;也不会在没有子节点时创建空的数组...
    },
  };
}

function render(element, container) {
  const dom =
    element.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);
  // 进一步考虑:要根据元素类型进行不同的处理,即文本节点和元素节点两种情况。
  const isProperty = (key) => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => (dom[name] = element.props[name]));
  // 将元素的属性分配每个节点...
  element.props.children.forEach((child) => {
    render(child, dom);
  });
  // element 的子节点也要通过遍历 render 函数来创建
  container.appendChild(dom);
}

const myReact = {
  createElement,
  render,
};

// const element = myReact.createElement(
//   'div',
//   { id: 'foo' },
//   React.createElement('a', null, 'bar'),
//   React.createElement('b'),
// );

// 如果想要让 babel 这样的转译器解析到 myReact.createElement 函数中...可以在 JSX 语法前添加一个注释:
// /** @jsx myReact.createElement */

// === 测试代码 ===

/** @jsx myReact.createElement */
const element = (
  <div style='background: salmon'>
    <h1>Hello World</h1>
    <h2 style='text-align:right'>from myReact</h2>
  </div>
);
const container = document.getElementById('root');
myReact.render(element, container);
// 如果代码正常运行,启动该项目打开网页会发现确实有背景为鲑红色的 div 元素。
