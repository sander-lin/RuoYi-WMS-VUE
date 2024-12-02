import request from '@/utils/request'

// 查询订单表列表
export function listOrder(query) {
  return request({
    url: '/wms/order/list',
    method: 'get',
    params: query
  })
}

export function listNotDraftOrder(query) {
  return request({
    url: '/wms/order/listNotDraft',
    method: 'get',
    params: query
  })
}

export function listDraftOrder(query) {
  query.status = 1
  return request({
    url: '/wms/order/list',
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
    url: '/wms/order',
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

// 查询订单关联商品
// export function listMerchandiseByOrderId(id) {
//   return request({
//     url: '/wms/order/listMerchandiseByOrderId/' + id,
//     method: 'get'
//   })
// }

// // 查询发货通知单关联商品
// export function listMerchandiseByNoticeId(id) {
//   return request({
//     url: '/wms/order/listMerchandiseByNoticeId/' + id,
//     method: 'get'
//   })
// }

