"use client"

import NavBar from '@/components/NavBar/NavBar'
import React, { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/lib/models'
import { authService } from '@/lib/auth'

function page() {
  const supabase = createClient();
  const [profile, setProfile] = React.useState<Profile | null>(null);

  useEffect(() => {
    refreshUserData();
  }, []);

  const refreshUserData = async () => {
    const { success, data, error } = await authService.getUserAndProfile();

    if (error) {
      console.log(error);
    }

    console.log(data);

    if (success && data) {
      setProfile(data.profile[0]);
    }
  };

  return (
    <>
    <NavBar profile={profile}/>
    <div>dashboard</div>
    </>
  )
}

export default page