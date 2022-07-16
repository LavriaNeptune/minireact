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

const myReact = {
  createElement,
};

const element = myReact.createElement(
  'div',
  { id: 'foo' },
  React.createElement('a', null, 'bar'),
  React.createElement('b'),
);

// 如果想要让 babel 这样的转译器解析到 myReact.createElement 函数中...可以在 JSX 语法前添加一个注释:
/** @jsx myReact.createElement */

const container = document.getElementById('root');
ReactDOM.render(element, container);
