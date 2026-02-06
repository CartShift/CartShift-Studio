'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';

const dropdownMenuVariants = cva(
  'fixed z-dropdown min-w-[200px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden',
  {
    variants: {
      align: {
        left: '',
        right: '',
      },
    },
    defaultVariants: {
      align: 'right',
    },
  }
);

const dropdownItemVariants = cva(
  'w-full px-4 py-3 min-h-[44px] text-sm font-medium text-start flex items-center gap-3 transition-colors duration-150 touch-manipulation active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
      },
      isDisabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
      active: {
        true: 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      isDisabled: false,
      active: false,
    },
  }
);

export interface DropdownItem extends VariantProps<typeof dropdownItemVariants> {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}

interface DropdownProps extends VariantProps<typeof dropdownMenuVariants> {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [focusedIndex, setFocusedIndex] = useState(-1); // For keyboard navigation
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    transform: '',
    transformOrigin: '',
    maxWidth: 300,
    maxHeight: 400,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      updateCoords();
      const viewportWidth = window.innerWidth;
      const edgePadding = 12;
      const rect = triggerRef.current.getBoundingClientRect();
      const maxDropdownWidth = viewportWidth - edgePadding * 2;

      let initialLeft = align === 'right' ? rect.left + rect.width : rect.left;
      let initialTransform = align === 'right' ? 'translateX(-100%)' : 'none';
      let initialTransformOrigin = align === 'right' ? 'top right' : 'top left';

      if (align === 'right') {
        const leftEdge = initialLeft - 200;
        if (leftEdge < edgePadding) {
          initialLeft = rect.left;
          initialTransform = 'none';
          initialTransformOrigin = 'top left';
        } else if (initialLeft > viewportWidth - edgePadding) {
          initialLeft = viewportWidth - edgePadding;
          initialTransform = 'translateX(-100%)';
          initialTransformOrigin = 'top right';
        }
      } else {
        const rightEdge = initialLeft + 200;
        if (rightEdge > viewportWidth - edgePadding) {
          initialLeft = Math.max(edgePadding, viewportWidth - 200 - edgePadding);
          initialTransform = 'none';
          initialTransformOrigin = 'top left';
        } else if (initialLeft < edgePadding) {
          initialLeft = edgePadding;
        }
      }

      setPosition({
        top: rect.top + rect.height + 8,
        left: initialLeft,
        transform: initialTransform,
        transformOrigin: initialTransformOrigin,
        maxWidth: maxDropdownWidth,
        maxHeight: Math.min(window.innerHeight - edgePadding * 2, 400),
      });
    }
  }, [isOpen, align, updateCoords]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const calculatePosition = (useEstimated = false) => {
        requestAnimationFrame(() => {
          if (!triggerRef.current || !dropdownRef.current) return;

          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const edgePadding = 16;
          const spacing = 8;
          const estimatedItemHeight = 44;
          const estimatedDropdownHeight = items.length * estimatedItemHeight + 16;

          const dropdownWidth = useEstimated ? 200 : Math.max(200, dropdownRef.current.offsetWidth);
          const dropdownHeight = useEstimated
            ? estimatedDropdownHeight
            : dropdownRef.current.offsetHeight;

          const maxDropdownWidth = Math.max(200, viewportWidth - edgePadding * 2);
          const actualDropdownWidth = Math.min(dropdownWidth, maxDropdownWidth);

          let calculatedLeft: number;
          let calculatedTop: number;
          let calculatedTransform = '';
          let calculatedTransformOrigin = 'top left';

          calculatedTop = coords.top + coords.height + spacing;

          if (align === 'right') {
            calculatedLeft = coords.left + coords.width;
            const leftEdgeWithTransform = calculatedLeft - actualDropdownWidth;

            if (leftEdgeWithTransform >= edgePadding) {
              calculatedTransform = 'translateX(-100%)';
              calculatedTransformOrigin = 'top right';
            } else {
              calculatedLeft = coords.left;
              calculatedTransform = '';
              calculatedTransformOrigin = 'top left';
            }
          } else {
            calculatedLeft = coords.left;
            const rightEdge = calculatedLeft + actualDropdownWidth;

            if (rightEdge <= viewportWidth - edgePadding) {
              calculatedTransform = '';
              calculatedTransformOrigin = 'top left';
            } else {
              const spaceOnRight = viewportWidth - coords.left - coords.width;
              if (spaceOnRight >= actualDropdownWidth + edgePadding) {
                calculatedLeft = coords.left + coords.width;
                calculatedTransform = '';
                calculatedTransformOrigin = 'top left';
              } else {
                calculatedLeft = edgePadding;
                calculatedTransform = '';
                calculatedTransformOrigin = 'top left';
              }
            }
          }

          const finalLeftEdge =
            calculatedTransform === 'translateX(-100%)'
              ? calculatedLeft - actualDropdownWidth
              : calculatedLeft;
          const finalRightEdge =
            calculatedTransform === 'translateX(-100%)'
              ? calculatedLeft
              : calculatedLeft + actualDropdownWidth;

          if (finalLeftEdge < edgePadding) {
            calculatedLeft = edgePadding;
            calculatedTransform = '';
            calculatedTransformOrigin = 'top left';
          }

          if (finalRightEdge > viewportWidth - edgePadding) {
            calculatedLeft = viewportWidth - edgePadding;
            calculatedTransform = 'translateX(-100%)';
            calculatedTransformOrigin = 'top right';
          }

          const bottomEdge = calculatedTop + dropdownHeight;
          if (bottomEdge > viewportHeight - edgePadding) {
            const spaceAbove = coords.top - edgePadding;
            const spaceBelow = viewportHeight - coords.top - coords.height - edgePadding;

            if (spaceAbove >= dropdownHeight && spaceAbove > spaceBelow) {
              calculatedTop = coords.top - dropdownHeight - spacing;
              calculatedTransformOrigin = calculatedTransformOrigin.replace('top', 'bottom');
            } else {
              calculatedTop = Math.max(edgePadding, viewportHeight - dropdownHeight - edgePadding);
            }
          }

          if (calculatedTop < edgePadding) {
            calculatedTop = edgePadding;
          }

          const finalLeftEdgeCheck =
            calculatedTransform === 'translateX(-100%)'
              ? calculatedLeft - actualDropdownWidth
              : calculatedLeft;
          const finalRightEdgeCheck =
            calculatedTransform === 'translateX(-100%)'
              ? calculatedLeft
              : calculatedLeft + actualDropdownWidth;

          if (
            finalLeftEdgeCheck < edgePadding ||
            finalRightEdgeCheck > viewportWidth - edgePadding
          ) {
            calculatedLeft = Math.max(
              edgePadding,
              Math.min(viewportWidth - actualDropdownWidth - edgePadding, calculatedLeft)
            );
            calculatedTransform = '';
            calculatedTransformOrigin = 'top left';
          }

          setPosition({
            top: calculatedTop,
            left: calculatedLeft,
            transform: calculatedTransform,
            transformOrigin: calculatedTransformOrigin,
            maxWidth: maxDropdownWidth,
            maxHeight: Math.min(viewportHeight - edgePadding * 2, 400),
          });
        });
      };

      calculatePosition(true);

      const timeoutId = setTimeout(() => {
        calculatePosition(false);
      }, 0);

      const resizeObserver = new ResizeObserver(() => {
        calculatePosition(false);
      });

      if (dropdownRef.current) {
        resizeObserver.observe(dropdownRef.current);
      }

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [isOpen, coords, align, items.length]);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleResize = () => {
        updateCoords();
      };
      const handleScroll = () => {
        updateCoords();
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
    return undefined;
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const checkAndFixPosition = () => {
        requestAnimationFrame(() => {
          if (!dropdownRef.current) return;

          const rect = dropdownRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const edgePadding = 16;

          const actualLeft = rect.left;
          const actualRight = rect.right;
          const actualWidth = rect.width;

          if (actualLeft < edgePadding || actualRight > viewportWidth - edgePadding) {
            let newLeft: number;

            if (actualLeft < edgePadding) {
              newLeft = edgePadding;
            } else {
              newLeft = Math.max(edgePadding, viewportWidth - actualWidth - edgePadding);
            }

            setPosition(prev => ({
              ...prev,
              left: newLeft,
              transform: '',
              transformOrigin: 'top left',
            }));
          }
        });
      };

      const timeoutId1 = setTimeout(checkAndFixPosition, 50);
      const timeoutId2 = setTimeout(checkAndFixPosition, 150);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        return;
      }

      // Arrow key navigation
      const enabledIndices = items
        .map((item, i) => (!item.disabled ? i : -1))
        .filter(i => i !== -1);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentEnabledIndex = enabledIndices.indexOf(focusedIndex);
        const nextIndex =
          currentEnabledIndex < enabledIndices.length - 1
            ? enabledIndices[currentEnabledIndex + 1]
            : enabledIndices[0];
        setFocusedIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentEnabledIndex = enabledIndices.indexOf(focusedIndex);
        const prevIndex =
          currentEnabledIndex > 0
            ? enabledIndices[currentEnabledIndex - 1]
            : enabledIndices[enabledIndices.length - 1];
        setFocusedIndex(prevIndex);
        itemRefs.current[prevIndex]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        const firstEnabled = enabledIndices[0];
        if (firstEnabled !== undefined) {
          setFocusedIndex(firstEnabled);
          itemRefs.current[firstEnabled]?.focus();
        }
      } else if (event.key === 'End') {
        event.preventDefault();
        const lastEnabled = enabledIndices[enabledIndices.length - 1];
        if (lastEnabled !== undefined) {
          setFocusedIndex(lastEnabled);
          itemRefs.current[lastEnabled]?.focus();
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (focusedIndex >= 0 && !items[focusedIndex].disabled) {
          event.preventDefault();
          items[focusedIndex].onClick();
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Focus first enabled item when opening
      if (focusedIndex === -1) {
        const firstEnabled = items.findIndex(item => !item.disabled);
        if (firstEnabled !== -1) {
          setFocusedIndex(firstEnabled);
          // Small delay to ensure dropdown is rendered
          requestAnimationFrame(() => {
            itemRefs.current[firstEnabled]?.focus();
          });
        }
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const dropdownMenu = (
    <AnimatePresence>
      {isOpen &&
        (isMobile ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-modal backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-inline-0 z-tooltip bg-white dark:bg-surface-900 rounded-t-3xl border-t border-surface-200 dark:border-surface-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="w-12 h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full mx-auto my-3 flex-shrink-0" />
              <div className="overflow-y-auto py-2 px-4 pb-8">
                {items.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (!item.disabled) {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    disabled={item.disabled}
                    className={cn(
                      dropdownItemVariants({
                        variant: item.variant,
                        isDisabled: item.disabled,
                        active: item.active,
                      }),
                      'py-4 text-base'
                    )}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(dropdownMenuVariants({ align }))}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: position.transform,
              transformOrigin: position.transformOrigin,
              zIndex: 'var(--z-dropdown, 10)',
              width: 'auto',
              maxWidth: `${position.maxWidth}px`,
              maxHeight: `${position.maxHeight}px`,
              boxSizing: 'border-box',
              marginLeft: 0,
              marginRight: 0,
            }}
          >
            <div
              className="py-2 overflow-y-auto"
              style={{ maxHeight: `${position.maxHeight - 16}px` }}
              role="menu"
              aria-orientation="vertical"
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  ref={el => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onClick={e => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                      setFocusedIndex(-1);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    dropdownItemVariants({
                      variant: item.variant,
                      isDisabled: item.disabled,
                      active: item.active,
                    }),
                    focusedIndex === index && 'bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
    </AnimatePresence>
  );

  const isTriggerButton = React.isValidElement(trigger) && trigger.type === 'button';

  const triggerElement = isTriggerButton ? (
    React.cloneElement(trigger as React.ReactElement<any>, {
      ref: (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        const originalRef = (trigger as any).ref;
        if (typeof originalRef === 'function') {
          originalRef(node);
        } else if (originalRef) {
          originalRef.current = node;
        }
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
        const triggerElement = trigger as React.ReactElement;
        if (
          triggerElement?.props &&
          typeof triggerElement.props === 'object' &&
          triggerElement.props !== null &&
          'onClick' in triggerElement.props &&
          typeof triggerElement.props.onClick === 'function'
        ) {
          triggerElement.props.onClick(e);
        }
      },
      'aria-haspopup': 'true',
      'aria-expanded': isOpen,
    })
  ) : (
    <button
      ref={triggerRef}
      type="button"
      onClick={e => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      className="inline-flex items-center justify-center"
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      {trigger}
    </button>
  );

  return (
    <div className={cn('relative inline-block', className)} style={{ overflow: 'visible' }}>
      {triggerElement}

      {mounted && typeof document !== 'undefined' && document.body
        ? createPortal(dropdownMenu, document.body)
        : null}
    </div>
  );
}
