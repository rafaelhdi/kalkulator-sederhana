/**
 * Kalkulator sederhana — logika aplikasi.
 * Dipisah dari index.html supaya markup dan perilaku tidak bercampur.
 * Memakai jQuery lokal (vendor/jquery-3.7.1.min.js).
 */
jQuery(function ($) {
    let current = '0';
    let first = null;
    let operator = null;
    let newNumber = false;
    let error = '';
    let expression = '';
    let lastOperator = null;
    let lastOperand = null;
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    function render() {
        const display = $('#display').text(current.replace('.', ',')).css('font-size', '48px');
        let fontSize = 48;
        while (display[0].scrollWidth > display[0].clientWidth && fontSize > 16) {
            fontSize -= 2;
            display.css('font-size', fontSize + 'px');
        }
        $('#expression').text(expression);
        $('.screen').toggleClass('has-error', Boolean(error));
        $('#status').text(error || (operator ? 'Masukkan angka berikutnya' : 'Siap menghitung'));
        $('.operator').removeClass('is-active').attr('aria-pressed', 'false');
        if (operator) {
            $('.operator[data-key="' + operator + '"]').addClass('is-active').attr('aria-pressed', 'true');
        }
    }

    function reset() {
        current = '0';
        first = null;
        operator = null;
        newNumber = false;
        error = '';
        expression = '';
        lastOperator = null;
        lastOperand = null;
    }

    // Operasi berantai dihitung dari kiri ke kanan, seperti kalkulator biasa.
    // Tidak memakai eval() agar masukan tidak dieksekusi sebagai kode.
    function calculate(left, right, operation) {
        const result = operation === '+' ? left + right
            : operation === '-' ? left - right
            : operation === '*' ? left * right : left / right;
        if (!Number.isFinite(result)) {
            error = right === 0 && operation === '/'
                ? 'Tidak bisa membagi dengan nol.' : 'Hasil di luar batas angka.';
            return '0';
        }
        // Kurangi artefak floating point, misalnya hasil 0,1 + 0,2.
        return String(Number(result.toPrecision(12)));
    }

    $('.keypad').on('click', 'button', function () {
        const key = $(this).attr('data-key');
        if (error) reset();

        if (/^\d$/.test(key) || key === '.') {
            if (newNumber && !operator) {
                expression = '';
                lastOperator = null;
            }
            if (key === '.') {
                if (newNumber) current = '0';
                if (!current.includes('.')) current += '.';
            } else {
                if (!newNumber && current.replace(/[^0-9]/g, '').length >= 16) return;
                current = newNumber || current === '0' ? key : current + key;
            }
            newNumber = false;
        } else if (key === 'sign' || key === 'percent') {
            if (newNumber && operator) current = '0';
            if (key === 'sign') {
                if (Number(current) !== 0) current = current.startsWith('-') ? current.slice(1) : '-' + current;
            } else {
                current = String(Number((Number(current) / 100).toPrecision(12)));
            }
            newNumber = false;
            lastOperator = null;
            if (!operator) expression = '';
        } else if (key === 'delete') {
            if (!newNumber) current = current.slice(0, -1) || '0';
            if (current === '-') current = '0';
        } else if (key === 'clear') {
            reset();
        } else if (['+', '-', '*', '/'].includes(key)) {
            if (operator && !newNumber) current = calculate(first, Number(current), operator);
            if (error) {
                operator = null;
            } else {
                first = Number(current);
                operator = key;
                expression = current.replace('.', ',') + ' ' + symbols[key];
            }
            lastOperator = null;
            newNumber = true;
        } else if (key === '=') {
            const operation = operator || lastOperator;
            if (operation) {
                const left = operator ? first : Number(current);
                const right = operator ? Number(current) : lastOperand;
                expression = String(left).replace('.', ',') + ' ' + symbols[operation]
                    + ' ' + String(right).replace('.', ',') + ' =';
                current = calculate(left, right, operation);
                lastOperator = error ? null : operation;
                lastOperand = right;
                operator = null;
            }
            newNumber = true;
        }
        render();
    });

    $(document).on('keydown', function (event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if ($(event.target).is('input, textarea, select, [contenteditable="true"]')) return;
        // Biarkan Enter/Space pada tombol yang fokus memakai perilaku native.
        if ($(event.target).is('button') && (event.key === 'Enter' || event.key === ' ')) return;
        const shortcuts = { Enter: '=', Escape: 'clear', Backspace: 'delete', Delete: 'clear', ',': '.', '%': 'percent' };
        const key = shortcuts[event.key] || event.key;
        const button = $('.keypad button').filter(function () {
            return $(this).attr('data-key') === key;
        });
        if (button.length) {
            event.preventDefault();
            button.trigger('click');
        }
    });

    render();
});
