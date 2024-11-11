import request from '@/utils/request'

// 查询资金明细表列表
export function listFinancial(query) {
  return request({
    url: '/wms/financial/list',
    method: 'get',
    params: query
  })
}

// 查询资金明细表详细
export function getFinancial(id) {
  return request({
    url: '/wms/financial/' + id,
    method: 'get'
  })
}

// 新增资金明细表
export function addFinancial(data) {
  return request({
    url: '/wms/financial',
    method: 'post',
    data: data
  })
}

// 修改资金明细表
export function updateFinancial(data) {
  return request({
    url: '/wms/financial',
    method: 'put',
    data: data
  })
}

// 删除资金明细表
export function delFinancial(id) {
  return request({
    url: '/wms/financial/' + id,
    method: 'delete'
  })
}
