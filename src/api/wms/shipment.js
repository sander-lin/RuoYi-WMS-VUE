import request from '@/utils/request'

// 查询发货管理列表
export function listShipment(query) {
  return request({
    url: '/wms/shipment/list',
    method: 'get',
    params: query
  })
}

// 查询发货管理详细
export function getShipment(id) {
  return request({
    url: '/wms/shipment/' + id,
    method: 'get'
  })
}

// 新增发货管理
export function addShipment(data) {
  return request({
    url: '/wms/shipment',
    method: 'post',
    data: data
  })
}

// 修改发货管理
export function updateShipment(data) {
  return request({
    url: '/wms/shipment',
    method: 'put',
    data: data
  })
}

// 删除发货管理
export function delShipment(id) {
  return request({
    url: '/wms/shipment/' + id,
    method: 'delete'
  })
}
