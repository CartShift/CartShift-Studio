'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useScroll, useMotionValueEvent } from '@/lib/motion';

/**
 * Unified Navigation State Management Hook
 * Consolidates Header navigation state to reduce complexity and prevent re-renders
 * Addresses Issue #1 from UX_DESIGN_ISSUES_SUMMARY.md
 */

export type DropdownType = 'solutions' | 'company' | 'tools' | null;
export type MobileDropdownType = 'solutions' | 'company' | 'tools' | null;

export interface NavigationState {
  // Mobile menu
  isMobileMenuOpen: boolean;
  // Desktop dropdowns - only one can be open at a time
  activeDropdown: DropdownType;
  // Mobile submenu expansion - only one at a time
  activeMobileDropdown: MobileDropdownType;
  // Header visibility states
  isHeaderVisible: boolean;
  isAtTop: boolean;
}

export interface NavigationActions {
  // Mobile menu
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  // Desktop dropdowns
  openDropdown: (type: DropdownType) => void;
  closeDropdown: () => void;
  toggleDropdown: (type: DropdownType) => void;
  // Mobile submenus
  toggleMobileDropdown: (type: MobileDropdownType) => void;
  // Utility
  closeAll: () => void;
}

export interface NavigationRefs {
  // Dropdown containers
  solutionsRef: React.RefObject<HTMLDivElement | null>;
  companyRef: React.RefObject<HTMLDivElement | null>;
  toolsRef: React.RefObject<HTMLDivElement | null>;
  // Dropdown buttons
  solutionsButtonRef: React.RefObject<HTMLButtonElement | null>;
  companyButtonRef: React.RefObject<HTMLButtonElement | null>;
  toolsButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export interface UseNavigationStateReturn {
  state: NavigationState;
  actions: NavigationActions;
  refs: NavigationRefs;
}

export function useNavigationState(): UseNavigationStateReturn {
  // Consolidated state - single source of truth
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState<MobileDropdownType>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  // Refs for click-outside detection
  const solutionsRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const solutionsButtonRef = useRef<HTMLButtonElement>(null);
  const companyButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Smart scroll behavior
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', latest => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    setIsAtTop(latest < 10);

    // Close mobile menu on scroll down
    if (latest > 50 && diff > 5 && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Smart header hide/show
    if (latest > 100) {
      if (diff > 10) setIsHeaderVisible(false);
      else if (diff < -10) setIsHeaderVisible(true);
    } else {
      setIsHeaderVisible(true);
    }
  });

  // Body scroll lock for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeDropdown) return;

      const refs = {
        solutions: { container: solutionsRef, button: solutionsButtonRef },
        company: { container: companyRef, button: companyButtonRef },
        tools: { container: toolsRef, button: toolsButtonRef },
      };

      const currentRefs = refs[activeDropdown];
      if (
        currentRefs.container.current &&
        !currentRefs.container.current.contains(event.target as Node) &&
        currentRefs.button.current &&
        !currentRefs.button.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeDropdown]);

  // Reset mobile submenus when mobile menu closes
  useEffect(() => {
    if (!isMobileMenuOpen) {
      setActiveMobileDropdown(null);
    }
  }, [isMobileMenuOpen]);

  // Actions
  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen(prev => !prev), []);

  const openDropdown = useCallback((type: DropdownType) => setActiveDropdown(type), []);
  const closeDropdown = useCallback(() => setActiveDropdown(null), []);
  const toggleDropdown = useCallback(
    (type: DropdownType) => setActiveDropdown(prev => (prev === type ? null : type)),
    []
  );

  const toggleMobileDropdown = useCallback(
    (type: MobileDropdownType) => setActiveMobileDropdown(prev => (prev === type ? null : type)),
    []
  );

  const closeAll = useCallback(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setActiveMobileDropdown(null);
  }, []);

  return {
    state: {
      isMobileMenuOpen,
      activeDropdown,
      activeMobileDropdown,
      isHeaderVisible,
      isAtTop,
    },
    actions: {
      openMobileMenu,
      closeMobileMenu,
      toggleMobileMenu,
      openDropdown,
      closeDropdown,
      toggleDropdown,
      toggleMobileDropdown,
      closeAll,
    },
    refs: {
      solutionsRef,
      companyRef,
      toolsRef,
      solutionsButtonRef,
      companyButtonRef,
      toolsButtonRef,
    },
  };
}
