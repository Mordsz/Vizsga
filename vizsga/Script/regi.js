// Simple client-side validation + password strength
    const form = document.getElementById('regForm');
    const pw = document.getElementById('password');
    const confirm = document.getElementById('confirm');
    const pwBar = document.getElementById('pwBar');
    const submitBtn = document.getElementById('submitBtn');

    function setHelper(name, msg, isError){
      const el = document.querySelector(`.helper[data-for="${name}"]`);
      if(!el) return;
      el.textContent = msg || '';
      el.style.color = isError ? '#f97316' : '#94a3b8';
    }

    function strengthScore(s){
      let score=0;
      if(s.length>=8) score+=1;
      if(/[A-Z]/.test(s)) score+=1;
      if(/[0-9]/.test(s)) score+=1;
      if(/[^A-Za-z0-9]/.test(s)) score+=1;
      return score; // 0..4
    }

    pw.addEventListener('input', ()=>{
      const s=strengthScore(pw.value);
      const pct = (s/4)*100;
      pwBar.style.width = pct + '%';
      pwBar.className = '';
      if(s<=1) pwBar.classList.add('pw-weak');
      else if(s==2 || s==3) pwBar.classList.add('pw-medium');
      else pwBar.classList.add('pw-strong');

      if(pw.value.length < 8) setHelper('password','A jelszónak legalább 8 karakter hosszúnak kell lennie.', true);
      else setHelper('password','');
    });

    function validate(){
      let ok = true;
      // built-in validity
      const fields = ['first','last','email','username','password','confirm'];
      fields.forEach(id=>{
        const f = document.getElementById(id);
        if(!f.checkValidity()){
          setHelper(id, f.validationMessage || 'Kötelező mező', true);
          ok = false;
        } else setHelper(id,'');
      });

      // custom: password match
      if(pw.value && confirm.value && pw.value !== confirm.value){
        setHelper('confirm','A két jelszó nem egyezik.', true);
        ok = false;
      }

      // email simple pattern
      const email = document.getElementById('email');
      if(email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)){
        setHelper('email','Érvénytelen e-mail cím.', true);
        ok=false;
      }

      // disable submit while invalid
      submitBtn.disabled = !ok;
      return ok;
    }

    form.addEventListener('input', validate);

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(!validate()) return;

      // Simulated success (no backend) - you can replace with fetch() to your API
      submitBtn.disabled = true;
      submitBtn.textContent = 'Feldolgozás...';

      setTimeout(()=>{
        alert('Sikeres regisztráció! Ellenőrizd az e-mail címed a megerősítéshez.');
        form.reset();
        pwBar.style.width='0%';
        submitBtn.textContent = 'Regisztráció';
        submitBtn.disabled = false;
      },750);
    });

    // initial validation pass
    validate();
    // Profilkép előnézet
  const pfpInput = document.getElementById('pfpUpload');
  const pfpPrevContainer = document.getElementById('pfpPreviewContainer');
  const pfpPrev = document.getElementById('pfpPreview');

  if(pfpInput){
    pfpInput.addEventListener('change', ()=>{
      const file = pfpInput.files[0];
      if(!file){
        pfpPrevContainer.style.display = 'none';
        return;
      }
      const reader = new FileReader();
      reader.onload = e =>{
        pfpPrev.src = e.target.result;
        pfpPrevContainer.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }