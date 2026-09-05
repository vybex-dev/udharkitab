/**
 * hooks/useCustomerListSearch.js
 * Local name/phone search + the show/hide state for a list screen's
 * search bar. Shared by app/pending.jsx and app/settled.jsx so the
 * search UX (and its filtering rules) never drifts between the two.
 */

import { useState, useMemo } from "react";
import { Keyboard } from "react-native";

export function useCustomerListSearch(customers) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    const digitsQuery = q.replace(/\D/g, "");
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch =
        digitsQuery.length > 0 &&
        !!c.phone &&
        c.phone.replace(/\D/g, "").includes(digitsQuery);
      return nameMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  function openSearch() {
    setSearchActive(true);
  }

  function closeSearch() {
    setSearchActive(false);
    setSearchQuery("");
    Keyboard.dismiss();
  }

  return {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredCustomers,
    openSearch,
    closeSearch,
  };
}
