import { supabase } from '../supabaseClient.js';

export const mpesaApi = {
  
  /**
   * Triggers an M-Pesa STK Push to the user's phone
   */
  triggerDeposit: async (amount, phoneNumber) => {
    try {
      // Instead of talking to a custom JS backend, we invoke a highly secure
      // Supabase Edge Function that holds our Safaricom credentials.
      const { data, error } = await supabase.functions.invoke('mpesa-express', {
        body: { 
          amount: amount, 
          phone: phoneNumber 
        }
      });

      if (error) throw error;
      return data;

    } catch (err) {
      console.error("M-Pesa API Error:", err.message);
      throw new Error("Failed to connect to Safaricom. Please try again.");
    }
  },

  /**
   * (Future) Triggers a B2C transfer to send money back to the user's M-Pesa
   */
  triggerWithdrawal: async (amount, phoneNumber) => {
    // We will wire this up to the mpesa-b2c edge function later
  }

};

export default mpesaApi;