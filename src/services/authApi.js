import { supabase } from '../supabaseClient';

// We package everything inside this single 'authApi' object
const authApi = {

  // 1. Perfectly matched to AuthGateway: authApi.login(phone, password)
  login: async (phone, password) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, auth_uid, email, role, full_name, phone_number')
      .eq('phone_number', phone) // Uses our phone system
      .eq('pass_hash', password) 
      .single();

    if (error || !data) throw new Error("Invalid phone number or password");
    return data;
  },

  // 2. Perfectly matched to AuthGateway: authApi.register(phone, fullName, password)
  register: async (phone, fullName, password) => {
    // This inserts the user. The Supabase trigger we wrote will automatically
    // create their wallet and give the first 100 users the $50 bonus!
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        phone_number: phone, // Uses our phone system
        full_name: fullName,
        pass_hash: password, 
        role: 'USER' 
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // 3. Kept your advanced password reset functions intact for the future!
  requestPasswordReset: async (email) => {
    const { data, error } = await supabase.rpc('generate_recovery_token', { target_email: email });
    if (error) throw new Error("Failed to generate token.");
    return data;
  },

  verifyAndResetPassword: async (email, token, newPassword) => {
    const { data, error } = await supabase.rpc('reset_forgotten_password', {
      target_email: email,
      submitted_token: token,
      new_hash: newPassword
    });
    if (error || !data) throw new Error("Invalid or expired PIN.");
    return data;
  }
};

// Now, the box actually exists to be exported!
export default authApi;