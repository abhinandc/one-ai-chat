import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		fontFamily: {
    			sans: [
    				'SF Pro Display',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'system-ui',
    				'sans-serif'
    			],
    			display: [
    				'SF Pro Display',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'system-ui',
    				'sans-serif'
    			],
    			text: [
    				'SF Pro Display',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'system-ui',
    				'sans-serif'
    			]
    		},
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			'surface-graphite': {
    				DEFAULT: 'hsl(var(--surface-graphite))',
    				hover: 'hsl(var(--surface-graphite-hover))',
    				active: 'hsl(var(--surface-graphite-active))'
    			},
    			'text-primary': 'hsl(var(--text-primary))',
    			'text-secondary': 'hsl(var(--text-secondary))',
    			'text-tertiary': 'hsl(var(--text-tertiary))',
    			'text-quaternary': 'hsl(var(--text-quaternary))',
    			'accent-blue': {
    				DEFAULT: 'hsl(var(--accent-blue))',
    				hover: 'hsl(var(--accent-blue-hover))'
    			},
    			'accent-green': 'hsl(var(--accent-green))',
    			'accent-orange': 'hsl(var(--accent-orange))',
    			'accent-red': 'hsl(var(--accent-red))',
    			'interactive-hover': 'hsl(var(--interactive-hover))',
    			'interactive-active': 'hsl(var(--interactive-active))',
    			'interactive-selected': 'hsl(var(--interactive-selected))',
    			'border-primary': 'hsl(var(--border-primary))',
    			'border-secondary': 'hsl(var(--border-secondary))',
    			divider: 'hsl(var(--divider))',
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		spacing: {
    			xs: 'var(--space-xs)',
    			sm: 'var(--space-sm)',
    			md: 'var(--space-md)',
    			lg: 'var(--space-lg)',
    			xl: 'var(--space-xl)',
    			'2xl': 'var(--space-2xl)',
    			'3xl': 'var(--space-3xl)'
    		},
    		borderRadius: {
    			xs: 'var(--radius-xs)',
    			sm: 'var(--radius-sm)',
    			md: 'var(--radius-md)',
    			lg: 'var(--radius-lg)',
    			xl: 'var(--radius-xl)',
    			'2xl': 'var(--radius-2xl)'
    		},
    		backdropBlur: {
    			sm: 'var(--blur-sm)',
    			md: 'var(--blur-md)',
    			lg: 'var(--blur-lg)'
    		},
    		boxShadow: {
    			glass: 'var(--shadow-glass)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)'
    		},
    		transitionDuration: {
    			fast: 'var(--duration-fast)',
    			normal: 'var(--duration-normal)',
    			slow: 'var(--duration-slow)'
    		},
    		backgroundImage: {
    			'gradient-primary': 'linear-gradient(135deg, hsl(var(--accent-blue)) 0%, hsl(211 100% 75%) 100%)',
    			'gradient-surface': 'linear-gradient(135deg, hsl(var(--surface-graphite)) 0%, hsl(var(--surface-graphite-hover)) 100%)',
    			'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    			'gradient-animated': 'linear-gradient(-45deg, hsl(var(--surface-graphite)), hsl(var(--surface-graphite-hover)), hsl(var(--accent-blue) / 0.1), hsl(var(--surface-graphite)))'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'fade-in': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(4px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'slide-in': {
    				'0%': {
    					transform: 'translateX(-100%)'
    				},
    				'100%': {
    					transform: 'translateX(0)'
    				}
    			},
    			'gentle-bounce': {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-2px)'
    				}
    			},
    			'gradient-shift': {
    				'0%': {
    					backgroundPosition: '0% 50%'
    				},
    				'50%': {
    					backgroundPosition: '100% 50%'
    				},
    				'100%': {
    					backgroundPosition: '0% 50%'
    				}
    			},
    			'glow-pulse': {
    				'0%, 100%': {
    					boxShadow: '0 0 20px hsla(var(--accent-blue), 0.3)'
    				},
    				'50%': {
    					boxShadow: '0 0 40px hsla(var(--accent-blue), 0.6), 0 0 60px hsla(var(--accent-blue), 0.3)'
    				}
    			},
    			trail: {
    				'0%': {
    					'--angle': '0deg'
    				},
    				'100%': {
    					'--angle': '360deg'
    				}
    			},
    			typing: {
    				'0%, 100%': {
    					transform: 'translateY(0)',
    					opacity: '0.5'
    				},
    				'50%': {
    					transform: 'translateY(-2px)',
    					opacity: '1'
    				}
    			},
    			'loading-dots': {
    				'0%, 100%': {
    					opacity: '0'
    				},
    				'50%': {
    					opacity: '1'
    				}
    			},
    			wave: {
    				'0%, 100%': {
    					transform: 'scaleY(1)'
    				},
    				'50%': {
    					transform: 'scaleY(0.6)'
    				}
    			},
    			blink: {
    				'0%, 100%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '0'
    				}
    			},
    			'text-blink': {
    				'0%, 100%': {
    					color: 'hsl(var(--primary))'
    				},
    				'50%': {
    					color: 'hsl(var(--muted-foreground))'
    				}
    			},
    			'bounce-dots': {
    				'0%, 100%': {
    					transform: 'scale(0.8)',
    					opacity: '0.5'
    				},
    				'50%': {
    					transform: 'scale(1.2)',
    					opacity: '1'
    				}
    			},
    			'thin-pulse': {
    				'0%, 100%': {
    					transform: 'scale(0.95)',
    					opacity: '0.8'
    				},
    				'50%': {
    					transform: 'scale(1.05)',
    					opacity: '0.4'
    				}
    			},
    			'pulse-dot': {
    				'0%, 100%': {
    					transform: 'scale(1)',
    					opacity: '0.8'
    				},
    				'50%': {
    					transform: 'scale(1.5)',
    					opacity: '1'
    				}
    			},
    			'shimmer-text': {
    				'0%': {
    					backgroundPosition: '150% center'
    				},
    				'100%': {
    					backgroundPosition: '-150% center'
    				}
    			},
    			'wave-bars': {
    				'0%, 100%': {
    					transform: 'scaleY(1)',
    					opacity: '0.5'
    				},
    				'50%': {
    					transform: 'scaleY(0.6)',
    					opacity: '1'
    				}
    			},
    			shimmer: {
    				'0%': {
    					backgroundPosition: '200% 50%'
    				},
    				'100%': {
    					backgroundPosition: '-200% 50%'
    				}
    			},
    			'spinner-fade': {
    				'0%': {
    					opacity: '0'
    				},
    				'100%': {
    					opacity: '1'
    				}
    			},
    			'orb-pulse': {
    				'0%, 100%': {
    					transform: 'scale(1)',
    					opacity: '0.6',
    					boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)'
    				},
    				'50%': {
    					transform: 'scale(1.05)',
    					opacity: '0.9',
    					boxShadow: '0 0 30px 10px hsl(var(--primary) / 0.2)'
    				}
    			},
    			'orb-ring': {
    				'0%': {
    					transform: 'scale(0.8)',
    					opacity: '0.8'
    				},
    				'100%': {
    					transform: 'scale(2)',
    					opacity: '0'
    				}
    			},
    			'message-in': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(10px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'scale-in': {
    				'0%': {
    					opacity: '0',
    					transform: 'scale(0.95)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'scale(1)'
    				}
    			},
    			'slide-up': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.3s ease-out',
    			'slide-in': 'slide-in 0.3s ease-out',
    			'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
    			'gradient-shift': 'gradient-shift 8s ease infinite',
    			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
    			trail: 'trail var(--duration) linear infinite',
    			'orb-pulse': 'orb-pulse 3s ease-in-out infinite',
    			'orb-ring': 'orb-ring 2s ease-out infinite',
    			'message-in': 'message-in 0.3s ease-out',
    			'scale-in': 'scale-in 0.2s ease-out',
    			'slide-up': 'slide-up 0.4s ease-out',
    			'marquee-left': 'marquee-left var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)',
    			'marquee-right': 'marquee-right var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)',
    			'marquee-up': 'marquee-up var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)',
    			'marquee-down': 'marquee-down var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)',
    			'marquee-left-rtl': 'marquee-left-rtl var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)',
    			'marquee-right-rtl': 'marquee-right-rtl var(--marquee-duration, 20s) linear var(--marquee-loop-count, infinite)'
    		}
    	},
    	keyframes: {
    		typing: {
    			'0%, 100%': {
    				transform: 'translateY(0)',
    				opacity: '0.5'
    			},
    			'50%': {
    				transform: 'translateY(-2px)',
    				opacity: '1'
    			}
    		},
    		'loading-dots': {
    			'0%, 100%': {
    				opacity: '0'
    			},
    			'50%': {
    				opacity: '1'
    			}
    		},
    		wave: {
    			'0%, 100%': {
    				transform: 'scaleY(1)'
    			},
    			'50%': {
    				transform: 'scaleY(0.6)'
    			}
    		},
    		blink: {
    			'0%, 100%': {
    				opacity: '1'
    			},
    			'50%': {
    				opacity: '0'
    			}
    		},
    		'marquee-left': {
    			'0%': { transform: 'translateX(0)' },
    			'100%': { transform: 'translateX(calc(-100% - var(--marquee-gap, 1rem)))' }
    		},
    		'marquee-right': {
    			'0%': { transform: 'translateX(calc(-100% - var(--marquee-gap, 1rem)))' },
    			'100%': { transform: 'translateX(0)' }
    		},
    		'marquee-up': {
    			'0%': { transform: 'translateY(0)' },
    			'100%': { transform: 'translateY(calc(-100% - var(--marquee-gap, 1rem)))' }
    		},
    		'marquee-down': {
    			'0%': { transform: 'translateY(calc(-100% - var(--marquee-gap, 1rem)))' },
    			'100%': { transform: 'translateY(0)' }
    		},
    		'marquee-left-rtl': {
    			'0%': { transform: 'translateX(0)' },
    			'100%': { transform: 'translateX(calc(100% + var(--marquee-gap, 1rem)))' }
    		},
    		'marquee-right-rtl': {
    			'0%': { transform: 'translateX(calc(100% + var(--marquee-gap, 1rem)))' },
    			'100%': { transform: 'translateX(0)' }
    		}
    	},
    	'text-blink': {
    		'0%, 100%': {
    			color: 'var(--primary)'
    		},
    		'50%': {
    			color: 'var(--muted-foreground)'
    		}
    	},
    	'bounce-dots': {
    		'0%, 100%': {
    			transform: 'scale(0.8)',
    			opacity: '0.5'
    		},
    		'50%': {
    			transform: 'scale(1.2)',
    			opacity: '1'
    		}
    	},
    	'thin-pulse': {
    		'0%, 100%': {
    			transform: 'scale(0.95)',
    			opacity: '0.8'
    		},
    		'50%': {
    			transform: 'scale(1.05)',
    			opacity: '0.4'
    		}
    	},
    	'pulse-dot': {
    		'0%, 100%': {
    			transform: 'scale(1)',
    			opacity: '0.8'
    		},
    		'50%': {
    			transform: 'scale(1.5)',
    			opacity: '1'
    		}
    	},
    	'shimmer-text': {
    		'0%': {
    			backgroundPosition: '150% center'
    		},
    		'100%': {
    			backgroundPosition: '-150% center'
    		}
    	},
    	'wave-bars': {
    		'0%, 100%': {
    			transform: 'scaleY(1)',
    			opacity: '0.5'
    		},
    		'50%': {
    			transform: 'scaleY(0.6)',
    			opacity: '1'
    		}
    	},
    	shimmer: {
    		'0%': {
    			backgroundPosition: '200% 50%'
    		},
    		'100%': {
    			backgroundPosition: '-200% 50%'
    		}
    	},
    	'spinner-fade': {
    		'0%': {
    			opacity: '0'
    		},
    		'100%': {
    			opacity: '1'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
