export const chapters = [
  { slug: 'introduction', name: '绪论', symbol: '00', description: '建立数据结构、抽象数据类型与算法复杂度的基础认识。', topics: ['基本概念', '抽象数据类型', '复杂度分析'] },
  { slug: 'linear-list', name: '线性表', symbol: '01', description: '从顺序存储到链式存储，理解数据之间的线性关系。', topics: ['顺序表', '单链表', '双向链表'] },
  { slug: 'stack-queue', name: '栈与队列', symbol: '02', description: '探索先进先出与后进先出，认识受限的线性结构。', topics: ['顺序栈', '链栈', '循环队列'] },
  { slug: 'string', name: '串', symbol: '03', description: '认识字符串的存储方式与模式匹配的基本问题。', topics: ['串的存储', '模式匹配', 'KMP'] },
  { slug: 'tree', name: '树与二叉树', symbol: '04', description: '走进层次结构，建立遍历与递归的直觉。', topics: ['二叉树', '树的遍历', '哈夫曼树'] },
  { slug: 'graph', name: '图', symbol: '05', description: '用顶点与边描述连接，理解复杂关系的表达。', topics: ['图的存储', '图的遍历', '最短路径'] },
  { slug: 'search', name: '查找', symbol: '06', description: '从有序表到散列表，了解高效定位数据的思路。', topics: ['折半查找', '二叉排序树', '散列表'] },
  { slug: 'sort', name: '排序', symbol: '07', description: '比较不同排序策略，理解时间与空间的权衡。', topics: ['插入排序', '快速排序', '归并排序'] },
] as const
