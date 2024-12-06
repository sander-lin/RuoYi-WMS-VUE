import request from '@/utils/request'

// 查询订单表列表
export function listOrder(query) {
  return request({
    url: '/wms/order/list',
    method: 'get',
    params: query
  })
}

// export function listNotDraftOrder(query) {
//   return request({
//     url: '/wms/order/listNotDraft',
//     method: 'get',
//     params: query
//   })
// }

export function listDraftOrder(query) {
  return request({
    url: '/wms/order/list/draft',
    method: 'get',
    params: query
  })
}

// 查询订单表详细
export function getOrder(id) {
  return request({
    url: '/wms/order/' + id,
    method: 'get'
  })
}

// 新增订单表
export function addOrder(data) {
  return request({
    url: '/wms/order',
    method: 'post',
    data: data
  })
}

// 修改订单表
export function updateOrder(data) {
  return request({
    url: '/wms/order',
    method: 'put',
    data: data
  })
}

// 修改订单状态
export function updateOrderStatus(data) {
  return request({
    url: '/wms/order/status',
    method: 'put',
    data: data
  })
}

// 删除订单表
export function delOrder(id) {
  return request({
    url: '/wms/order/' + id,
    method: 'delete'
  })
}

//创建草稿订单
export function createDraftOrder(data) {
  return request({
    url: '/wms/order/draft',
    method: 'post',
    data: data
  })
}

// 发布订单草稿
export function publishDraftOrder(data) {
  return request({
    url: '/wms/order/publish',
    method: 'put',
    data: data
  })
}