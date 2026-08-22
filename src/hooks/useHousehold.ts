import {useState, useEffect, useCallback} from 'react';
import {supabase} from '../supabase-client';

export interface HouseholdMember {
  userId: string;
  email: string | null;
}

export interface HouseholdState {
  householdId: string | null;
  isPrimary: boolean;
  member: HouseholdMember | null;
  inviteCode: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useHousehold(): HouseholdState {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [member, setMember] = useState<HouseholdMember | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const {data: memberRow} = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let hid: string;

      if (memberRow) {
        hid = memberRow.household_id;
      } else {
        // Auto-create a solo household on first use
        const {data: newHousehold, error: createError} = await supabase
          .from('households')
          .insert({primary_user_id: user.id})
          .select('id')
          .single();

        if (createError || !newHousehold) {
          return;
        }

        await supabase
          .from('household_members')
          .insert({household_id: newHousehold.id, user_id: user.id});

        hid = newHousehold.id;
      }

      const {data: household} = await supabase
        .from('households')
        .select('id, primary_user_id, invite_code')
        .eq('id', hid)
        .single();

      if (!household) {
        return;
      }

      setHouseholdId(household.id);
      setIsPrimary(household.primary_user_id === user.id);
      setInviteCode(household.invite_code ?? null);

      // Load the other member (if any)
      const {data: otherMembers} = await supabase
        .from('household_members')
        .select('user_id, email')
        .eq('household_id', hid)
        .neq('user_id', user.id);

      setMember(
        otherMembers && otherMembers.length > 0
          ? {userId: otherMembers[0].user_id, email: otherMembers[0].email}
          : null,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {householdId, isPrimary, member, inviteCode, isLoading, refresh: load};
}
