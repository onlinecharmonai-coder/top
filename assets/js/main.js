/* ========================================
   GASTRO KILLER - Main JavaScript
   ======================================== */

// ===== CONFIGURATION =====
// Replace these with your actual credentials
const CONFIG = {
    // Google Apps Script Web App URL
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
    
    // Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
    TELEGRAM_CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID',
    
    // WhatsApp Number (with country code, no +)
    WHATSAPP_NUMBER: '880XXXXXXXXXX'
};

// ===== COUNTDOWN TIMER =====
function initCountdown() {
    // Set countdown to end of day or a specific future time
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 0);
    
    function updateTimer() {
        const now = new Date();
        const diff = endOfDay - now;
        
        if (diff <= 0) {
            // Reset for next day
            endOfDay.setDate(endOfDay.getDate() + 1);
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}


// ===== FAQ ACCORDION =====
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// ===== VIDEO SECTION =====
function initVideo() {
    const placeholder = document.getElementById('videoPlaceholder');
    if (!placeholder) return;
    
    placeholder.addEventListener('click', () => {
        const iframe = placeholder.querySelector('iframe');
        if (iframe && iframe.dataset.src) {
            iframe.src = iframe.dataset.src + '?autoplay=1';
            placeholder.classList.add('active');
        }
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.problem-card, .benefit-card, .ingredient-card, .step-card, .trust-card, .review-card, .faq-item'
    );
    
    elements.forEach(el => el.classList.add('fade-in'));
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    elements.forEach(el => observer.observe(el));
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });
}


// ===== FORM VALIDATION =====
function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 3) {
        errors.push('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
    }
    
    // Validate Bangladeshi phone number
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s-]/g, ''))) {
        errors.push('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
    }
    
    if (!data.address || data.address.trim().length < 10) {
        errors.push('অনুগ্রহ করে সম্পূর্ণ ঠিকানা লিখুন');
    }
    
    return errors;
}

// ===== GET CURRENT DATE/TIME IN BANGLA FORMAT =====
function getCurrentDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Dhaka'
    };
    return now.toLocaleString('bn-BD', options);
}

// ===== SEND TO GOOGLE SHEETS =====
async function sendToGoogleSheets(data) {
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                phone: data.phone,
                address: data.address,
                quantity: data.quantity,
                datetime: getCurrentDateTime()
            })
        });
        return true;
    } catch (error) {
        console.error('Google Sheets Error:', error);
        return false;
    }
}

// ===== SEND TO TELEGRAM =====
async function sendToTelegram(data) {
    const message = `
🛒 *নতুন অর্ডার পেয়েছেন!*
-------------------
👤 *নাম:* ${data.name}
📞 *ফোন:* ${data.phone}
📍 *ঠিকানা:* ${data.address}
📦 *পরিমাণ:* ${data.quantity} পিস
🕒 *সময়:* ${getCurrentDateTime()}
-------------------`;

    try {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const result = await response.json();
        return result.ok;
    } catch (error) {
        console.error('Telegram Error:', error);
        return false;
    }
}


// ===== ORDER FORM SUBMISSION =====
function initOrderForm() {
    const form = document.getElementById('orderForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.btn-order');
        const originalText = submitBtn.innerHTML;
        
        // Gather form data
        const formData = {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            quantity: document.getElementById('customerQty').value
        };
        
        // Validate
        const errors = validateForm(formData);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> অপেক্ষা করুন...';
        submitBtn.disabled = true;
        
        try {
            // Send to both Google Sheets and Telegram
            await Promise.all([
                sendToGoogleSheets(formData),
                sendToTelegram(formData)
            ]);
            
            // Show success modal
            showSuccessModal();
            
            // Reset form
            form.reset();
        } catch (error) {
            console.error('Order submission error:', error);
            // Still show success - data might have been saved
            showSuccessModal();
            form.reset();
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ===== MODAL FUNCTIONS =====
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});


// ===== HEADER SCROLL EFFECT =====
function initHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
}

// ===== AUTO FOCUS ON ORDER FORM =====
function initAutoFocus() {
    const orderLinks = document.querySelectorAll('a[href="#order"]');
    orderLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(() => {
                const nameInput = document.getElementById('customerName');
                if (nameInput) nameInput.focus();
            }, 800);
        });
    });
}

// ===== INITIALIZE ALL =====
document.addEventListener('DOMContentLoaded', function() {
    initCountdown();
    initFAQ();
    initVideo();
    initScrollAnimations();
    initSmoothScroll();
    initOrderForm();
    initHeaderScroll();
    initAutoFocus();
});
