chrome.runtime.sendMessage({ getExtensionState: true }, (response) => {
    if (response && response.extensionState) {

        const originalProfessorElements = [];
        const professorCache = {};
        
        // Cache with professor info, to avoid repeat api calls on mutations
        async function addToCache(name, prof) {
            const { avgRating, avgDifficulty, wouldTakeAgainPercent, numRatings, legacyId } = prof;
        
            professorCache[name] = {
                id: legacyId,
                rating: avgRating,
                difficulty: avgDifficulty,
                percentage: wouldTakeAgainPercent,
                numRatings: numRatings,
            };
        }
        
        // Fetch prof info from API
        async function getProf(name) {
            try {
                const response = await fetch(`https://glorious-gown-crow.cyclic.app/api/getProf/${name}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const { prof } = await response.json();
                await addToCache(name, prof); // Await the addToCache function
                return prof;
            } catch (error) {
                console.error('Fetch error:', error);
                return null;
            }
        }
        
        // Modify DOM elements to display ratings + tooltips
        async function modifyProfDivs(professorElement) {
            const professorNames = professorElement.textContent.trim().split('; ');
            
            // Clear the existing content of professorElement
            professorElement.innerHTML = '';
        
            for (const name of professorNames) {
                if (name === 'Staff') {
                    continue;
                }
        
                const ratingContainer = document.createElement('div');
                ratingContainer.className = 'prof-rating-container';
        
                if(!(name in professorCache)){
                    await getProf(name)
                } 
                const rating = professorCache[name].rating
                const formattedRating = Number(rating).toFixed(1)
                const difficulty = Number(professorCache[name].difficulty).toFixed(1)
                const percentage = (professorCache[name].percentage === -1) ? 'N/A' : Math.ceil(professorCache[name].percentage);
                const numOfRatings = professorCache[name].numRatings    
                const id = professorCache[name].id
                const starPercentage = (formattedRating / 5) * 100
        
                let backgroundColor;
                if (isNaN(rating)) {
                    backgroundColor = 'black';
                } else if (rating >= 0 && rating <= 2.5) {
                    backgroundColor = 'darkred';
                } else if (rating > 2.5 && rating <= 3.6) {
                    backgroundColor = 'darkorange';
                } else {
                    backgroundColor = 'darkgreen';
                }
                
                if(rating){
                    ratingContainer.innerHTML = `
                    <div style="position: relative;">
                        <span class="tooltip-container">
        
                            <div class="tooltip">
                            
                                <div class="tooltip-name">
                                    ${name}
                                </div>
        
                                <div class="tooltip-rating" title="${formattedRating}">
                                    <div class="ratings">
                                    <div class="empty-stars"></div>
                                    <div class="full-stars" style="width:${starPercentage}%"></div>
                                </div>
                                </div>
        
                                <div class="tooltip-data">
                                    
                                    <div class="tooltip-difficulty">
                                        ${difficulty}
                                        <div class="description">Difficulty level</div>
                                    </div>
        
                                    <div class="tooltip-take-again">
                                        ${percentage}%  
                                        <div class="description">Would take again</div>
                                    </div>   
        
                                </div>
        
                                <small class="tooltip-disclaimer">
                                    <hr>
                                    <div class="tooltip-based">
                                        Based on <a class="num-ratings" href="https://www.ratemyprofessors.com/professor/${id}" target="_blank">${numOfRatings} rating(s)</a>
                                    </div>
        
                                    Read reviews to determine rating accuracy
                                </small>
                            </div>
                        </span>   
        
                        <div class="modified-name">
                            <span class="rating" style="background-color: ${backgroundColor}">
                                ${formattedRating}
                            </span>  
                            <span class="prof-name">
                                ${name}
                            </span>
                        </div>
        
                    </div>
                `;
                } else {
                    const urlName = name.replace(' ', '+');
                    ratingContainer.innerHTML = `
                        <div style="position: relative;">
                            <span class="tooltip-container">
                                <div class="tooltip-name" style="text-align: center">
                                    ${name}
                                </div>
                                <br><br><br>
                                <div class="none">
                                    <div>No RateMyProf profile found</div>
                                    <a href="https://www.google.ca/search?q=${urlName}+rate+my+professor" target="_blank">Search</a>
                                </div>
                            </span>   
        
                            <div class="modified-name">
                                <span class="rating" style="background-color: ${backgroundColor}">
                                    N/A
                                </span>  
                                <span class="prof-name">
                                    ${name}
                                </span>
                        </div>
                        </div>
                    `;
                }
                
                const tooltip = ratingContainer.querySelector(".tooltip-container");
        
                function showTooltip() {
                    const tooltips = document.querySelectorAll(".tooltip-container");
                    tooltips.forEach((tooltip) => {
                        tooltip.style.display = "none";
                    });
        
                    tooltip.style.display = "block";
                }
        
                function hideTooltip() {
                    tooltip.style.display = "none";
                }
        
                ratingContainer.addEventListener("click", (event) => {
                    event.stopPropagation(); 
                    showTooltip();
                });
                
                document.addEventListener("click", hideTooltip); 
        
                professorElement.appendChild(ratingContainer);
            }
        
            // Add an event listener to the professorElement to handle the tooltips
            professorElement.addEventListener("mouseover", (event) => {
                if (event.target.classList.contains("prof-rating-container")) {
                    showTooltip();
                }
            });
        
            professorElement.addEventListener("mouseout", (event) => {
                if (event.target.classList.contains("prof-rating-container")) {
                    hideTooltip();
                }
            });
        }
        
        // General function to be called on all professors found on the page
        async function displayRatings() {
            const professorElements = document.querySelectorAll('[title="Instructor(s)"]');
            professorElements.forEach((professorElement) => {
                if (!professorElement.classList.contains('ratings-modified')) {
                    modifyProfDivs(professorElement);
                    professorElement.classList.add('ratings-modified');
                }
            });
        }
          
        // To observe changes in the DOM
        function handleMutation(mutationsList) {
            mutationsList.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    displayRatings();
                }
            });
        }
        
        // Mutation Observer
        const observer = new MutationObserver(handleMutation);
        const parentElement = document.body;
        const observerConfig = {
            childList: true,
            subtree: true,
        };
        observer.observe(parentElement, observerConfig);
        
    }
});


