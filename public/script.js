// Form Submission
document.getElementById('learningForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const goal = document.getElementById('goal').value;
  const interests = document.getElementById('interests').value;
  const skillLevel = document.getElementById('skillLevel').value;

  // Show loading spinner
  document.getElementById('loadingSpinner').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('structuredPath').classList.add('hidden');
  document.getElementById('outputActions').classList.add('hidden');

  try {
    const response = await fetch('/generate-learning-path', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goal, interests, skillLevel }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.learningPath) {
      throw new Error('No learning path generated');
    }

    // Display raw text
    document.getElementById('result').innerHTML = formatOutput(data.learningPath);
    document.getElementById('result').classList.remove('hidden');

    // Display structured path
    const structuredPath = generateStructuredPath(data.learningPath);
    document.getElementById('structuredPath').innerHTML = structuredPath;
    document.getElementById('structuredPath').classList.remove('hidden');

    // Show actions
    document.getElementById('outputActions').classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('result').textContent = `Failed to generate learning path. Error: ${error.message}`;
    document.getElementById('result').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSpinner').classList.add('hidden');
  }
});

// Format text output
function formatOutput(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/^(#+)\s(.*)/gm, (match, p1, p2) => {
      const level = p1.length;
      return `<h${level} class="text-${level === 1 ? '2xl' : 'xl'} font-bold mt-4">${p2}</h${level}>`;
    }) // Headings
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>') // Bullet points
    .replace(/\n/g, '<br>'); // Line breaks
}

// Generate structured learning path
function generateStructuredPath(learningPath) {
  const lines = learningPath.split('\n').filter(line => line.trim() !== '');
  let html = '';
  let currentPhase = null;

  for (const line of lines) {
    if (line.startsWith('**Phase') || line.startsWith('**Step')) {
      if (currentPhase) html += `</div></div>`;
      currentPhase = line.replace(/\*\*/g, '');
      html += `
        <div class="phase">
          <div class="phase-header" onclick="togglePhase(this)">
            <h3>${currentPhase}</h3>
            <span>▼</span>
          </div>
          <div class="phase-content">
      `;
    } else {
      const sanitizedStep = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      html += `
        <div class="step">
          <p>${sanitizedStep}</p>
        </div>
      `;
    }
  }

  if (currentPhase) html += `</div></div>`;
  return html;
}

// Toggle phase visibility
window.togglePhase = function(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('span');
  content.classList.toggle('open');
  arrow.style.transform = content.classList.contains('open') 
    ? 'rotate(180deg)' 
    : 'rotate(0deg)';
};

// Copy to clipboard
document.getElementById('copyButton').addEventListener('click', () => {
  const text = document.getElementById('result').textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
});

// Download as text
document.getElementById('downloadButton').addEventListener('click', () => {
  const text = document.getElementById('result').textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'learning-path.txt';
  a.click();
});

// Clear all
document.getElementById('clearButton').addEventListener('click', () => {
  document.getElementById('learningForm').reset();
  document.getElementById('result').textContent = '';
  document.getElementById('structuredPath').innerHTML = '';
  document.getElementById('result').classList.add('hidden');
  document.getElementById('structuredPath').classList.add('hidden');
  document.getElementById('outputActions').classList.add('hidden');
});