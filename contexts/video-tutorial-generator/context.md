The "Perfect" Prompt for Next Time:
Role & Goal:
Act as an expert UX/UI developer and technical writer. I am building a platform that turns YouTube videos into interactive, highly detailed text tutorials. I will provide a transcript with timestamps.
Layout & UI Requirements:
Create a single-file HTML/CSS/JS solution with a modern, clean UI (Tailwind-like aesthetic).
Left side: A sticky container with the embedded YouTube video.
Right side: A vertically scrollable container with the tutorial text divided into specific "Step Cards".
Visual Elements: Include timestamp buttons, category tags (e.g., [Setup], [Concept]), "TL;DR" boxes for summaries, and special callout boxes for "Important Notions/Concepts".
Interaction & UX Rules (Crucial):
Two-Way Sync: As I scroll down the text naturally, the video must scrub/seek to the corresponding timestamp. If I play the video, the text must auto-scroll to keep the active section in the center of the screen.
State Awareness: If the video is paused, scrolling the text should scrub the video timeline, but the video must stay paused. If it is playing, it should seamlessly keep playing.
Player UI: Keep the native YouTube controls (progress bar) visible so I can see the timeline moving as I scroll.
Content Processing Rules:
High Detail: Do not heavily summarize the transcript. Extract all technical steps, explanations, and generate formatted code blocks (<pre><code>) for any code mentioned.
Organize the text logically based on the timestamps provided.
Technical Details:
Use the official YouTube IFrame API.
Use a "safe" open-source placeholder video ID (like YE7VzlLtp-4) so I don't get YouTube API Error 153 when testing this locally on my computer.
Here is the transcript and timestamps:
[PASTE TRANSCRIPT HERE]
Why this prompt works so well:
"State Awareness" (Paused vs Playing): This is the biggest thing LLMs miss. Unless you explicitly tell an AI how to handle the paused state, it assumes "scrolling = seek = play", which causes the frustrating forced-playback you experienced.
"High Detail" instruction: LLMs naturally want to summarize large blocks of text. Telling it specifically to extract all technical steps and format code blocks forces it into "Technical Writer" mode rather than "Summary" mode.
"Two-Way Sync" & "Visible Controls": Explicitly stating these prevents the AI from trying to be "too clever" by hiding the native UI or only making the sync work in one direction.
The Error 153 Bypass: Mentioning the local testing error up front saves you 10 minutes of debugging a blank video player.
18.0s
User 1:58 AM
Also would've liked images/gifs in the tutorial part, so ffmpeg commands to cut out stuff from it
Model 1:58 AM
ThinkingThoughts
Expand to view model thoughts

chevron_right
Adding visuals (GIFs or static screenshots) is the "missing link" for a world-class tutorial. It allows the user to see the UI state without having to look back at the video constantly.
Here is the FFmpeg Toolkit to extract those visuals from your video file, followed by the Updated HTML with image placeholders integrated into the tutorial cards.
Part 1: The FFmpeg "Cutting" Toolkit
Run these commands in your terminal to generate the assets for the tutorial.
Replace input.mp4 with your video filename.
Purpose Segment FFmpeg Command
Demo Comparison (GIF)   00:35 - 00:45   ffmpeg -ss 00:00:35 -t 10 -i input.mp4 -filter_complex "[0:v] fps=12,scale=480:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse" demo-comparison.gif
Workflow Diagram (PNG)  01:43   ffmpeg -ss 00:01:43 -i input.mp4 -frames:v 1 workflow-diag.png
Recipe Nodes (GIF)  02:45 - 02:55   ffmpeg -ss 00:02:45 -t 10 -i input.mp4 -filter_complex "[0:v] fps=10,scale=480:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse" recipe-nodes.gif
Execution Progress (GIF)    05:22 - 05:27   ffmpeg -ss 00:05:22 -t 5 -i input.mp4 -filter_complex "[0:v] fps=10,scale=480:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse" execution.gif
Training Loss (PNG) 06:48   ffmpeg -ss 00:06:48 -i input.mp4 -frames:v 1 training-loss.png
Part 2: Updated HTML with Visuals Support
I have added an .step-image class and placed <img> tags in the relevant sections. When you generate the files above and save them in the same folder as this HTML, they will appear automatically.
code
Html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Scroll-Synced Tutorial: Unsloth Studio</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --text-main: #0f172a;
            --text-muted: #475569;
            --primary: #10b981; 
            --card-bg: #ffffff;
            --border: #e2e8f0;
            --notion-bg: #eff6ff;
            --notion-border: #bfdbfe;
            --tldr-bg: #fef2f2;
            --code-bg: #1e293b;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }

        body { background: var(--bg-color); color: var(--text-main); display: flex; height: 100vh; overflow: hidden; }

        .video-container { width: 50%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; position: sticky; top: 0; }
        .video-wrapper { width: 100%; max-width: 900px; aspect-ratio: 16/9; padding: 2rem; }
        .video-wrapper iframe { width: 100%; height: 100%; border-radius: 12px; }

        .tutorial-container { width: 50%; height: 100vh; overflow-y: auto; padding: 4rem; scroll-behavior: smooth; padding-bottom: 60vh; }

        .step-card { 
            background: var(--card-bg); border: 2px solid transparent; border-radius: 16px; 
            padding: 2.5rem; margin-bottom: 3rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); 
            transition: all 0.4s ease; opacity: 0.4; transform: scale(0.98);
        }
        .step-card.active { border-color: var(--primary); opacity: 1; transform: scale(1); }

        /* IMAGE STYLING */
        .step-image {
            width: 100%;
            border-radius: 12px;
            margin: 1.5rem 0;
            border: 1px solid var(--border);
            display: block;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        .step-header { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .timestamp { background: var(--primary); color: #fff; padding: 0.35rem 0.85rem; border-radius: 99px; cursor: pointer; font-weight: bold; }
        .tag { padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
        .tag-action { background: #dcfce7; color: #15803d; }
        .tag-concept { background: #e0f2fe; color: #0369a1; }

        .step-title { font-size: 1.6rem; margin-bottom: 1.5rem; font-weight: 800; }
        .explanation { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1rem; }
        .tldr { background: var(--tldr-bg); border-left: 4px solid #ef4444; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
        .notion { background: var(--notion-bg); border: 1px solid var(--notion-border); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
        pre { background: var(--code-bg); color: #e2e8f0; padding: 1.25rem; border-radius: 8px; font-size: 0.95rem; margin: 1rem 0; }

        @media (max-width: 1024px) { body { flex-direction: column; overflow: auto; } .video-container, .tutorial-container { width: 100%; height: auto; } }
    </style>
</head>
<body>

    <div class="video-container">
        <div class="video-wrapper"><div id="ytplayer"></div></div>
    </div>

    <div class="tutorial-container" id="tutorial-scroll-area">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Unsloth Studio: Visual Guide</h1>
        <p style="margin-bottom: 3rem; color: var(--text-muted);">The tutorial will scroll as you watch. Visuals are extracted directly from the video for clarity.</p>

        <!-- STEP 2: DEMO -->
        <div class="step-card" data-start="34" data-end="51">
            <div class="step-header">
                <span class="timestamp" onclick="seekVideo(34)">00:34</span>
                <span class="tag tag-concept">Demo</span>
            </div>
            <h2 class="step-title">Comparison: Base vs. Fine-Tuned</h2>
            <p class="explanation">Watch how the model on the right takes time to <strong>reason</strong> before answering.</p>
            
            <img src="demo-comparison.gif" alt="Before and After comparison" class="step-image">
            
            <p class="explanation">The "After" model uses a specialized thinking trace to ensure accuracy and depth.</p>
        </div>

        <!-- STEP 5: WORKFLOW -->
        <div class="step-card" data-start="142" data-end="228">
            <div class="step-header">
                <span class="timestamp" onclick="seekVideo(142)">01:42</span>
                <span class="tag tag-concept">Architecture</span>
            </div>
            <h2 class="step-title">The Synthetic Data Pipeline</h2>
            <p class="explanation">This diagram illustrates the Knowledge Distillation process.</p>
            
            <img src="workflow-diag.png" alt="Knowledge Distillation Diagram" class="step-image">
            
            <div class="notion">
                <p><strong>Teacher (Nemotron):</strong> Generates the high-quality reasoning traces.<br>
                <strong>Student (OLMo):</strong> Learns to mimic that reasoning at a smaller scale.</p>
            </div>
        </div>

        <!-- STEP 6: NODES -->
        <div class="step-card" data-start="229" data-end="448">
            <div class="step-header">
                <span class="timestamp" onclick="seekVideo(229)">02:29</span>
                <span class="tag tag-action">Recipe Setup</span>
            </div>
            <h2 class="step-title">Building the Recipe Nodes</h2>
            <p class="explanation">In the Recipes tab, we connect various blocks to define the data flow.</p>
            
            <img src="recipe-nodes.gif" alt="Setting up node blocks in Studio" class="step-image">
            
            <p class="explanation">We define the <strong>Model Provider</strong> (local endpoint) and <strong>Model Config</strong> (inference parameters).</p>
        </div>

        <!-- STEP 8: EXECUTION -->
        <div class="step-card" data-start="449" data-end="532">
            <div class="step-header">
                <span class="timestamp" onclick="seekVideo(449)">04:49</span>
                <span class="tag tag-action">Run Job</span>
            </div>
            <h2 class="step-title">Executing the Generation Job</h2>
            <p class="explanation">The generation process sends requests to the teacher model in batches.</p>
            
            <img src="execution.gif" alt="Job progress dashboard" class="step-image">
            
            <p class="explanation">You can monitor the terminal output and row counts as the 1000-row dataset is created.</p>
        </div>

        <!-- STEP 9: TRAINING -->
        <div class="step-card" data-start="533" data-end="710">
            <div class="step-header">
                <span class="timestamp" onclick="seekVideo(533)">05:33</span>
                <span class="tag tag-action">Training</span>
            </div>
            <h2 class="step-title">Monitoring Training Loss</h2>
            <p class="explanation">Once training begins, look for the <strong>Loss</strong> graph to trend downwards.</p>
            
            <img src="training-loss.png" alt="Training loss graphs in Studio" class="step-image">
            
            <p class="explanation">A decreasing loss curve confirms the student model is effectively learning the new reasoning behavior.</p>
        </div>

    </div>

    <script>
        const YOUTUBE_VIDEO_ID = 'YE7VzlLtp-4'; 
        let player;
        let userScrollingText = false;
        let scrollTimeout;
        const container = document.getElementById('tutorial-scroll-area');
        const steps = Array.from(document.querySelectorAll('.step-card'));

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('ytplayer', {
                height: '100%', width: '100%', videoId: YOUTUBE_VIDEO_ID,
                playerVars: { 'playsinline': 1, 'controls': 1, 'rel': 0 },
                events: { 'onReady': () => setInterval(syncLoop, 250) }
            });
        }

        function syncLoop() {
            if (!userScrollingText && player && player.getCurrentTime) {
                const currentTime = player.getCurrentTime();
                steps.forEach(step => {
                    const start = parseFloat(step.dataset.start);
                    const end = parseFloat(step.dataset.end);
                    if (currentTime >= start && currentTime < end) {
                        if (!step.classList.contains('active')) {
                            steps.forEach(s => s.classList.remove('active'));
                            step.classList.add('active');
                            step.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                });
            }
        }

        container.addEventListener('wheel', () => userScrollingText = true);
        container.addEventListener('scroll', () => {
            if (!userScrollingText) return;
            clearTimeout(scrollTimeout);
            
            let activeStep = steps[0];
            let minDistance = Infinity;
            steps.forEach(step => {
                const dist = Math.abs(step.getBoundingClientRect().top + (step.offsetHeight/2) - (window.innerHeight/2));
                if (dist < minDistance) { minDistance = dist; activeStep = step; }
            });

            if (!activeStep.classList.contains('active')) {
                steps.forEach(s => s.classList.remove('active'));
                activeStep.classList.add('active');
                player.seekTo(parseFloat(activeStep.dataset.start), true);
            }
            scrollTimeout = setTimeout(() => { userScrollingText = false; }, 200);
        });

        function seekVideo(seconds) {
            userScrollingText = false;
            player.seekTo(seconds, true);
            player.playVideo();
        }
    </script>
</body>
</html>
Pro Tip for Images:
If you want to use GIPHY or a hosted URL instead of local files, simply swap the src="demo-comparison.gif" with your hosted link (e.g., src="https://media.giphy.com/media/.../giphy.gif"). This makes the HTML file shareable without having to send a folder of images with it.
