document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('primaryAction').addEventListener('click', function(){
      document.querySelector('#rolunk').scrollIntoView({behavior:'smooth'});
    });

    function handleSubmit(){
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      // Ez csak demo: valós küldés backend kell
      alert('Köszönjük, ' + (name || 'Látogató') + '! Üzeneted elmentésre került (demo).');
      // reset
      document.querySelector('form').reset();
    }