import { ComputedRef } from 'vue'; 

/**
 * 发货通知单状态
 */
export type NoticeStatus = ComputedRef<{
  cao_gao: string;
  wei_fa_huo: string;
  bu_fen_fa_huo: string;
  quan_bu_fa_huo: string;
  yi_wan_cheng: string;
  yi_guan_bi: string;
}> 

/**
 * 发货单物流状态
 */
export type ShippingStatus =  ComputedRef<{
  kun_bao_zhong: string;
  pei_song_shou_pei_song_zhong: string;
  guo_ji_shu_song_zhong: string;
  yi_dao_huo: string;
}>

/**
 * 订单状态
 */
export type OrderStatus = ComputedRef<{
  dai_que_ding: string;
  cao_gao: string;
  mai_fu_zhong: string;
  pei_song_zhong: string;
  yi_wan_cheng: string;
}>
