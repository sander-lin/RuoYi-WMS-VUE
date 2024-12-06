import request from '@/utils/request'

// 查询商品管理列表
export function listMerchandise(query) {
  return request({
    url: '/wms/merchandise/list',
    method: 'get',
    params: query
  })
}

// 查询商品管理详细
export function getMerchandise(id) {
  return request({
    url: '/wms/merchandise/' + id,
    method: 'get'
  })
}

// 新增商品管理
export function addMerchandise(data) {
  return request({
    url: '/wms/merchandise',
    method: 'post',
    data: data
  })
}

// 修改商品管理
export function updateMerchandise(data) {
  return request({
    url: '/wms/merchandise',
    method: 'put',
    data: data
  })
}

// 删除商品管理
export function delMerchandise(id) {
  return request({
    url: '/wms/merchandise/' + id,
    method: 'delete'
  })
}

// 查询订单关联商品
export function listMerchandiseByOrderId(id) {
  return request({
    url: '/wms/merchandise/order/' + id,
    method: 'get'
  })
}

// 查询发货通知单关联商品
export function listMerchandiseByNoticeId(id) {
  return request({
    url: '/wms/merchandise/shipmentNotice/' + id,
    method: 'get'
  })
}
