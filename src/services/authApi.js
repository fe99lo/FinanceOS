// src/services/authApi.js
import { supabase } from '../supabaseClient';

export const loginUser = async (email, password) => {
  // Note: For a production app, never store plain text passwords. 
  // We match your custom pass_hash column from the migration setup.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_uid, email, role, full_name, phone_number')
    .eq('email', email)
    .eq('pass_hash', password) // Assuming basic matching for V1 pilot
    .single();

  if (error || !data) throw new Error("Invalid email or password");
  return data; // Returns the user profile and their role
};

export const registerUser = async (email, password, fullName, phoneNumber) => {
  // This inserts the user. The Supabase trigger we wrote will automatically
  // create their wallet and give the first 100 users the $50 bonus!
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ 
      email: email, 
      pass_hash: password, 
      full_name: fullName,
      phone_number: phoneNumber,
      role: 'USER' // Defaults to USER
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data, error } = await supabase.rpc('generate_recovery_token', { target_email: email });
  if (error) throw new Error("Failed to generate token.");
  return data; // Returns the 6-digit PIN
};

export const verifyAndResetPassword = async (email, token, newPassword) => {
  const { data, error } = await supabase.rpc('reset_forgotten_password', {
    target_email: email,
    submitted_token: token,
    new_hash: newPassword
  });
  if (error || !data) throw new Error("Invalid or expired PIN.");
  return data;
};
