import { supabase } from '../supabaseClient';

const authApi = {

  // Login now checks the Email column instead of Phone
  login: async (email, password) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, auth_uid, email, role, full_name, phone_number')
      .eq('email', email) 
      .eq('pass_hash', password) 
      .single();

    if (error || !data) throw new Error("Invalid email or password");
    return data;
  },

  // Registration now saves BOTH Email and Phone to the database
  register: async (email, phone, fullName, password) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        email: email,
        phone_number: phone, 
        full_name: fullName,
        pass_hash: password, 
        role: 'USER' 
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

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

export default authApi;