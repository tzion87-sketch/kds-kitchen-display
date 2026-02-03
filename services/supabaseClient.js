import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdrrqglgvpqskwjopsmr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tuatAdM6Jct99UDnFEiHbg_sXxNvmw2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchNewOrders = async (deviceId, sinceTimestamp) => {
  const { data, error } = await supabase
    .from('kitchen_orders')
    .select('*')
    .eq('device_id', deviceId)
    .eq('sent_to_device', false)
    .gt('created_at', sinceTimestamp)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
};

export const markOrdersAsSent = async (orderIds) => {
  const { error } = await supabase
    .from('kitchen_orders')
    .update({ sent_to_device: true })
    .in('id', orderIds);

  if (error) {
    console.error('Error marking orders as sent:', error);
  }
};
