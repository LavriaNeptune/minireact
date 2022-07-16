// 从挂载一个 react 元素开始展开聊

// === JSX Code ===

// const element = <h1 title='foo'>Hello</h1>;

// 上述 JSX 代码使用纯 JS 代码进行重写 ↓
// const element = React.createElement('h1', { title: 'foo' }, 'Hello');

// React.createElement 所做的是就是根据参数生成对应的虚拟节点对象 -> 本质上就是干了以下的事情
const element = {
  type: 'h1',
  props: { title: 'foo', children: 'Hello' },
};

// ====================================

const container = document.getElementById('root');

// ====================================

// ReactDom.render(element, container);
// ReactDom.render 是将虚拟 DOM 转化为真实 DOM 的函数,他做了以下事情

const node = document.createElement(element.type);
// 根据虚拟 DOM 的 type 属性,创建一个对应的真实 DOM 元素
node['title'] = element.props.title;

// 实例中的子节点是文字 -> 创建对应的文本节点,并赋予其响应的值
const text = document.createTextNode('');
text['nodeValue'] = element.props.children;

// 然后组装成真实 DOM 对象
node.appendChild(text);
container.append(node);
