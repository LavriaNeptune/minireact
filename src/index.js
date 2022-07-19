// 现在都是通过 JSX 语法来描述一个 React 组件 -> 或者说是 HTML 元素...
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

// ↓ 将 React.createElement 方法改写为原生 JS 的 createElement 方法,↓

// ↓↓↓↓↓↓↓↓↓↓↓  DOM 元素对象创建函数 ↓↓↓↓↓↓↓↓↓↓↓

function createElement(type, props, ...children) {
  // 使用 rest parameter 语法将 children 转化为数组 -> 这样方便通过数组的 map 方法来遍历 children 对象了了
  return {
    type,
    // 节点类型 -> 知晓了类型可以通过 type 属性 + document.createElement 这个原生方法来创建具体的 DOM 元素节点
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === 'object' ? child : createTextElement(child);
        // 如果 child 是字符串,则创建文本节点;如果 child 是对象,则直接返回
      }),
    },
    // DOM 元素节点上所具备的属性,注意这里有的 children 属性 -> 用来储存该节点的子节点相关信息...
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

// ↑↑↑↑↑↑↑↑↑↑↑  DOM 元素对象创建函数 ↑↑↑↑↑↑↑↑↑↑↑

// ↓↓↓↓↓↓↓↓↓↓↓  DOM 元素对象创建函数 ↓↓↓↓↓↓↓↓↓↓↓

function createDom(fiber) {
  const dom =
    fiber.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);
  // 进一步考虑:要根据元素类型进行不同的处理,即文本节点和元素节点两种情况。
  const isProperty = (key) => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => (dom[name] = fiber.props[name]));
  // 将元素的属性分配每个节点...
  return dom;
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // nextUnitOfWork 是一个用来存储 fiber node 信息的对象, dom 表示该节点的容器, props 表示该节点的属性, children 表示该节点的子节点
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  // 将当前的 fiber node 设置为根 fiber node
  wipRoot = null;
  // add dom nodes to the dom
}

function commitWork(fiber) {
  if (!fiber) {
    return;
    // 当 fiber node 为空时,说明已经渲染完成了,所以不需要再渲染了
  }
  const domParentNode = fiber.parent.dom;
  domParentNode.appendChild(fiber.dom);
  // 将 fiber node 的 dom 节点添加到父节点中
  commitWork(fiber.child);
  // 递归提交子节点
  commitWork(fiber.sibling);
  // 递归提交兄弟节点
}

// function render(element, container) {
//   const dom =
//     element.type == 'TEXT_ELEMENT'
//       ? document.createTextNode('')
//       : document.createElement(element.type);
//   // 进一步考虑:要根据元素类型进行不同的处理,即文本节点和元素节点两种情况。
//   const isProperty = (key) => key !== 'children';
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => (dom[name] = element.props[name]));
//   // 将元素的属性分配每个节点...
//   element.props.children.forEach((child) => {
//     render(child, dom);
//   });
//   // element 的子节点也要通过遍历 render 函数来创建
//   container.appendChild(dom);
// }

// ↑ 上述该渲染函数有一个存在一个缺陷:一旦开始渲染,不能停止渲染进度,必须要完整地渲染完整个元素树。如果元素树很大的话,可能会长时间阻塞主线程。让我们编写一些方法将渲染工作拆分为多个小任务,以便可以不必要地长时间阻塞主线程。

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;

// ↓↓↓↓↓↓↓↓↓↓↓  DOM 渲染任务分块执行 ↓↓↓↓↓↓↓↓↓↓↓

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
    // 当不存在下一个要处理的 fiber node 时,且当前没有在处理的 fiber node 时,说明已经渲染完成了,所以提交根 fiber node
  }
  requestIdleCallback(workLoop);
  // requestIdleCallback 是一个实验性质的方法:其作用是在当前线程没有任务时,调用传入其的回调函数...
}
// ↑↑↑↑↑↑↑↑↑↑↑ DOM 渲染任务分块执行 ↑↑↑↑↑↑↑↑↑↑↑

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
    // fiber dom 的值如果为空 表示初始化状态 需要将自身转换为 dom 节点; 如果不为空 则为根节点渲染情况,自带容器元素
  }

  /* 
    连续不断的插入新元素到父节点中,可能回影响用户体验...
  */
  /*   if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
    // 如果为空 -> 节点为 root 节点,什么也不做 如果不为空 将自身 DOM 元素插入到父节点中
  } */

  const elements = fiber.props.children;
  // 取出 fiber 的所有子节点进行操作
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
    // 如果 fiber 存在子节点,则返回子节点
  }
  let nextFiber = fiber;
  // 这里对 filer 做了存在性检测 -> fiber 存在再执行后续操作
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
      // 如果 fiber 存在兄弟节点,则返回兄弟节点
    }
    nextFiber = nextFiber.parent;
    // 如果 fiber 不存在兄弟节点,则返回父节点
  }

  function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber !== null) {
      // 只要 element 数组中还有元素,就一直进行渲染
      const element = elements[index];
      const newFiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
      };
      // 依照虚拟 DOM 的结构,创建一个新的 fiber 对象 -> 主要是多了 parent 和 dom 属性
      if (index === 0) {
        fiber.child = newFiber;
        // 当 index 为零时 -> 将其作为 fiber 的子节点插入
      } else {
        prevSibling.sibling = newFiber;
        // 当 index 不为零时 -> 将其作为其前一个兄弟节点的后续节点插入
      }
      prevSibling = newFiber;
      // 初始情况:将第一个 fiber 对象作为 prevSibling
      index++;
      // 节点计数器 +1
    }
  }
}

// 既然是重写 react -> 那就新建一个 myReact 对象收集以下自己写的接口吧
const myReact = {
  createElement,
  render,
};

// 理论上是要像下面代码这样使用 myReact.createElement 方法的,为了能使用 JSX 转译器...可以在 对应的 JSX 语法表示前添加一个注释:
// /** @jsx myReact.createElement */
// 这样 babel 就会将 myReact.createElement 函数代码转换为下述形式了...

// const element = myReact.createElement(
//   'div',
//   { id: 'foo' },
//   React.createElement('a', null, 'bar'),
//   React.createElement('b'),
// );

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
