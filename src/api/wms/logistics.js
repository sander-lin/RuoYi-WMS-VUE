import request from '@/utils/request'

// 查询物流信息列表
export function listLogistics(id) {
  return request({
    url: '/wms/logistics/listByShipmentId/' + id,
    method: 'get'
  })
}


// 新增物流信息
export function addLogistics(data) {
  return request({
    url: '/wms/logistics',
    method: 'post',
    data: data
  })
}

// 修改物流信息
export function updateLogistics(data) {
  return request({
    url: '/wms/logistics',
    method: 'put',
    data: data
  })
}

// 删除物流信息
export function delLogistics(id) {
  return request({
    url: '/wms/logistics/' + id,
    method: 'delete'
  })
}
