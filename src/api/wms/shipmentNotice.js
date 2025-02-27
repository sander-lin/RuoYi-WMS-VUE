import request from '@/utils/request'

// 查询发货请求通知单列表
export function listShipmentNotice(query) {
  return request({
    url: '/wms/shipmentNotice/list',
    method: 'get',
    params: query
  })
}

// 查询发货请求通知单草稿列表
export function listShipmentNoticeDraft(query) {
  return request({
    url: '/wms/shipmentNotice/list/draft',
    method: 'get',
    params: query
  })
}

// 查询发货请求通知单详细
export function getShipmentNotice(id) {
  return request({
    url: '/wms/shipmentNotice/' + id,
    method: 'get'
  })
}

// 新增发货请求通知单
export function addShipmentNotice(data) {
  return request({
    url: '/wms/shipmentNotice',
    method: 'post',
    data: data
  })
}

// 修改发货请求通知单状态
export function updateShipmentNoticeStatus(data) {
  return request({
    url: '/wms/shipmentNotice/status',
    method: 'put',
    data: data
  })
}

// 修改发货请求通知单
export function updateShipmentNotice(data) {
  return request({
    url: '/wms/shipmentNotice',
    method: 'put',
    data: data
  })
}

// 删除发货请求通知单
export function delShipmentNotice(id) {
  return request({
    url: '/wms/shipmentNotice/' + id,
    method: 'delete'
  })
}

//创建草稿发货通知单
export function createDraftShipmentNotice(data) {
  return request({
    url: '/wms/shipmentNotice/draft',
    method: 'post',
    data: data
  })
}