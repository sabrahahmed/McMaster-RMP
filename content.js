const professorCache = {};
const fetchedProfessors = {};

// Cache with professor info, to avoid repeat api calls on mutations
function addToCache(name, prof) {
    if(prof === 'N/A'){
        professorCache[name] = 'N/A'
        return
    }

    const { avgRating, avgDifficulty, wouldTakeAgainPercent, numRatings, legacyId } = prof;

    professorCache[name] = {
        id: legacyId,
        rating: Number(avgRating).toFixed(1),
        difficulty: Number(avgDifficulty).toFixed(1),
        percentage: (wouldTakeAgainPercent === -1) ? 'N/A' : Math.ceil(wouldTakeAgainPercent),
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
        addToCache(name, prof); 
        return prof;
        
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// Modify DOM elements to display ratings + tooltips
async function modifyProfDivs(professorElement) {
    const professorNames = professorElement.textContent.trim().split('; ');
    professorElement.innerHTML = ''

    // Clear the existing content of professorElement
    if (professorNames.length === 1 && professorNames[0] === 'Staff') {
        professorElement.textContent = 'Staff';
    }

    for (const name of professorNames) {
        if (name === 'Staff') continue;

        const ratingContainer = document.createElement('div');
        
        if (fetchedProfessors[name]) {
            await fetchedProfessors[name];
        } else {
            fetchedProfessors[name] = getProf(name);
            await fetchedProfessors[name];
        }

        if(professorCache[name] === 'N/A'){
            const urlName = name.replace(' ', '+');
            const googleSearch = `https://www.google.ca/search?q=${urlName}+rate+my+professor`
            
            ratingContainer.innerHTML = `
                <div style="position: relative;">
                    <span class="tooltip-container">
                        <div class="tooltip-name" style="text-align: center">
                            ${name}
                        </div>
                        <br><br><br>
                        <div class="none">
                            <div>No RateMyProf profile found</div>
                            <a href="${googleSearch}" target="_blank">Search</a>
                        </div>
                    </span>   

                    <div class="modified-name">
                        <span class="rating" style="background-color: black">
                            N/A
                        </span>  
                        <span class="prof-name">
                            ${name}
                        </span>
                </div>
                </div>
            `;
        } else {
            const { id, rating, difficulty, percentage, numRatings} = professorCache[name]

            const starPercentage = (rating / 5) * 100
    
            let backgroundColor;
            if (rating >= 0 && rating <= 2.5) {
                backgroundColor = 'darkred';
            } else if (rating > 2.5 && rating <= 3.6) {
                backgroundColor = 'darkorange';
            } else {
                backgroundColor = 'darkgreen';
            }
            
            ratingContainer.innerHTML = `
            <div style="position: relative;">
                <span class="tooltip-container">
    
                    <div class="tooltip">
                    
                        <div class="tooltip-name">${name}</div>
    
                        <div class="tooltip-rating" title="${rating}">
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
                                Based on <a class="num-ratings" href="https://www.ratemyprofessors.com/professor/${id}" target="_blank">${numRatings} rating(s)</a>
                            </div>
    
                            Read reviews to determine rating accuracy
                        </small>
                    </div>
                </span>   
    
                <div class="modified-name">
                    <span class="rating" style="background-color: ${backgroundColor}">
                        ${rating}
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
        
        ratingContainer.addEventListener("mouseover", (event) => {
            event.stopPropagation(); 
            showTooltip();
        });
        
        document.addEventListener("click", () => tooltip.style.display = "none"); 

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
function displayRatings() {
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
            // Update  professorElements reference
            professorElements = document.querySelectorAll('[title="Instructor(s)"]');
            displayRatings();
        }
    });
}
    
chrome.runtime.sendMessage({ getExtensionState: true }, (response) => {
    if (response && response.extensionState) {
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



