import request from '@/utils/request'

// 查询供应商列表
export function listSupplies(query) {
  return request({
    url: '/wms/supplies/list',
    method: 'get',
    params: query
  })
}

// 查询供应商详细
export function getSupplies(id) {
  return request({
    url: '/wms/supplies/' + id,
    method: 'get'
  })
}

// 新增供应商
export function addSupplies(data) {
  return request({
    url: '/wms/supplies',
    method: 'post',
    data: data
  })
}

// 修改供应商
export function updateSupplies(data) {
  return request({
    url: '/wms/supplies',
    method: 'put',
    data: data
  })
}

// 删除供应商
export function delSupplies(id) {
  return request({
    url: '/wms/supplies/' + id,
    method: 'delete'
  })
}
