// Form Submission
document.getElementById('learningForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal = document.getElementById('goal').value;
    const interests = document.getElementById('interests').value;
    const skillLevel = document.getElementById('skillLevel').value;

    console.log('Form submitted with:', { goal, interests, skillLevel });

    // Show loading spinner
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    document.getElementById('outputActions').classList.add('hidden');

    try {
        console.log('Sending request to /generate-learning-path...');
        const response = await fetch('/generate-learning-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ goal, interests, skillLevel }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.learningPath) {
            throw new Error('No learning path generated');
        }

        // Display the learning path
        document.getElementById('result').innerHTML = formatOutput(data.learningPath);
        document.getElementById('result').classList.remove('hidden');
        document.getElementById('outputActions').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').textContent = `Failed to generate learning path. Error: ${error.message}`;
        document.getElementById('result').classList.remove('hidden');
    } finally {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }
});

// Format Output with Markdown-like styling
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

// Copy to Clipboard
document.getElementById('copyButton').addEventListener('click', () => {
    const resultText = document.getElementById('result').textContent;
    navigator.clipboard.writeText(resultText).then(() => {
        alert('Learning path copied to clipboard!');
    });
});

// Download as PDF
document.getElementById('downloadButton').addEventListener('click', () => {
    const resultText = document.getElementById('result').textContent;
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learning-path.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// Share Link
document.getElementById('shareButton').addEventListener('click', () => {
    const resultText = document.getElementById('result').textContent;
    const shareableLink = `${window.location.origin}/share?text=${encodeURIComponent(resultText)}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
        alert('Shareable link copied to clipboard!');
    });
});

// Clear Form and Output
document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('learningForm').reset();
    document.getElementById('result').textContent = '';
    document.getElementById('result').classList.add('hidden');
    document.getElementById('outputActions').classList.add('hidden');
});