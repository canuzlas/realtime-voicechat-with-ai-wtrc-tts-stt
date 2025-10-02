module.exports = {
    darkMode: 'class', // enable class-based dark mode
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                neon: {
                    blue: '#00f3ff',
                    purple: '#bf00ff',
                    pink: '#ff00ff',
                    green: '#00ff9f',
                    yellow: '#ffff00',
                },
                cyber: {
                    dark: '#0a0a0f',
                    darker: '#050508',
                    light: '#1a1a2e',
                    accent: '#16213e',
                },
                glass: {
                    light: 'rgba(255, 255, 255, 0.1)',
                    lighter: 'rgba(255, 255, 255, 0.05)',
                }
            },
            animation: {
                'gradient-x': 'gradient-x 15s ease infinite',
                'gradient-xy': 'gradient-xy 15s ease infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float 8s ease-in-out infinite',
                'float-medium': 'float 4s ease-in-out infinite',
                'float-fast': 'float 3s ease-in-out infinite',
                'pulse-record': 'pulse-record 1.5s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'wave': 'wave 3s ease-in-out infinite',
                'slide-up': 'slide-up 0.5s ease-out',
                'slide-down': 'slide-down 0.5s ease-out',
                'fade-in': 'fade-in 0.6s ease-out',
                'spin-slow': 'spin 8s linear infinite',
                'bounce-slow': 'bounce 3s infinite',
            },
            keyframes: {
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center',
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center',
                    },
                },
                'gradient-xy': {
                    '0%, 100%': {
                        'background-size': '400% 400%',
                        'background-position': 'left center'
                    },
                    '25%': {
                        'background-size': '400% 400%',
                        'background-position': 'right center'
                    },
                    '50%': {
                        'background-size': '400% 400%',
                        'background-position': 'center bottom'
                    },
                    '75%': {
                        'background-size': '400% 400%',
                        'background-position': 'left top'
                    }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-record': {
                    '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: '1'
                    },
                    '50%': {
                        transform: 'scale(1.1)',
                        opacity: '0.8'
                    }
                },
                'pulse-glow': {
                    '0%, 100%': {
                        opacity: '1',
                        boxShadow: '0 0 20px rgba(0, 243, 255, 0.5)'
                    },
                    '50%': {
                        opacity: '0.8',
                        boxShadow: '0 0 40px rgba(0, 243, 255, 0.8), 0 0 60px rgba(191, 0, 255, 0.6)'
                    }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' }
                },
                'wave': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(5deg)' },
                    '75%': { transform: 'rotate(-5deg)' }
                },
                'slide-up': {
                    '0%': {
                        transform: 'translateY(100px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'slide-down': {
                    '0%': {
                        transform: 'translateY(-100px)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                }
            },
            backdropBlur: {
                xs: '2px',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(280, 100%, 70%, 1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242, 100%, 70%, 1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 1) 0px, transparent 50%)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
