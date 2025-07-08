// Skill Matrix App - JavaScript treasure map
class SkillMatrix {
    constructor() {
        this.members = [];
        this.skills = [];
        this.currentMemberId = null;
        this.init();
    }

    // Initialize the app - hoist the colors!
    async init() {
        await this.loadMembers();
        await this.loadSkills();
        this.renderMembers();
        this.updateStats();
        this.setupEventListeners();
    }

    // Load team members from the server
    async loadMembers() {
        try {
            const response = await fetch('/api/members');
            this.members = await response.json();
        } catch (error) {
            console.error('Failed to load crew members:', error);
        }
    }

    // Load available skills from the server
    async loadSkills() {
        try {
            const response = await fetch('/api/skills');
            this.skills = await response.json();
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    }

    // Render team members grid - display the crew
    renderMembers() {
        const grid = document.getElementById('membersGrid');
        
        if (this.members.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <h3>🏴‍☠️ No crew members aboard yet!</h3>
                    <p>Add your first developer to start tracking skills.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.members.map(member => `
            <div class="member-card">
                <div class="member-header">
                    <div class="member-avatar">${member.avatar}</div>
                    <div class="member-info">
                        <h3>${member.name}</h3>
                        <div class="member-role">${member.role}</div>
                    </div>
                </div>
                
                <div class="member-skills">
                    <div class="skills-header">
                        <h4>Skills (${member.skills.length})</h4>
                        <button class="manage-skills-btn" onclick="app.openSkillAssignment(${member.id})">
                            Manage
                        </button>
                    </div>
                    
                    <div class="skills-list">
                        ${member.skills.length > 0 ? 
                            member.skills.map(skill => `
                                <div class="skill-chip">
                                    <span>${skill.icon} ${skill.name}</span>
                                    <div class="skill-level">
                                        ${Array.from({length: 5}, (_, i) => 
                                            `<div class="skill-dot ${i < skill.level ? 'filled' : ''}"></div>`
                                        ).join('')}
                                    </div>
                                </div>
                            `).join('') : 
                            '<span style="color: var(--text-secondary); font-style: italic;">No skills assigned yet</span>'
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update statistics dashboard
    updateStats() {
        const totalMembers = this.members.length;
        const totalSkills = this.skills.length;
        
        // Calculate average skill level across all members
        let totalSkillLevels = 0;
        let skillCount = 0;
        
        this.members.forEach(member => {
            member.skills.forEach(skill => {
                totalSkillLevels += skill.level;
                skillCount++;
            });
        });
        
        const avgSkillLevel = skillCount > 0 ? (totalSkillLevels / skillCount).toFixed(1) : 0;
        
        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('totalSkills').textContent = totalSkills;
        document.getElementById('avgSkillLevel').textContent = avgSkillLevel;
    }

    // Setup event listeners for forms
    setupEventListeners() {
        // Add member form submission
        document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addMember();
        });

        // Add skill form submission
        document.getElementById('addSkillForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addSkill();
        });
    }

    // Add new team member
    async addMember() {
        const name = document.getElementById('memberName').value;
        const role = document.getElementById('memberRole').value;
        const avatar = document.getElementById('memberAvatar').value || '🧑‍💻';

        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, avatar })
            });

            if (response.ok) {
                await this.loadMembers();
                this.renderMembers();
                this.updateStats();
                this.closeModal('addMemberModal');
                document.getElementById('addMemberForm').reset();
                this.showNotification('🎉 New crew member added!');
            }
        } catch (error) {
            console.error('Failed to add member:', error);
            this.showNotification('❌ Failed to add crew member', 'error');
        }
    }

    // Add new skill
    async addSkill() {
        const name = document.getElementById('skillName').value;
        const category = document.getElementById('skillCategory').value;
        const icon = document.getElementById('skillIcon').value || '⚡';

        try {
            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, icon })
            });

            if (response.ok) {
                await this.loadSkills();
                this.closeModal('addSkillModal');
                document.getElementById('addSkillForm').reset();
                this.showNotification('⚡ New skill discovered!');
            }
        } catch (error) {
            console.error('Failed to add skill:', error);
            this.showNotification('❌ Failed to add skill', 'error');
        }
    }

    // Open skill assignment modal for a member
    openSkillAssignment(memberId) {
        this.currentMemberId = memberId;
        const member = this.members.find(m => m.id === memberId);
        
        document.getElementById('assignModalTitle').textContent = `⚡ Manage Skills - ${member.name}`;
        
        const container = document.getElementById('skillsAssignment');
        container.innerHTML = this.skills.map(skill => {
            const memberSkill = member.skills.find(s => s.name === skill.name);
            const currentLevel = memberSkill ? memberSkill.level : 0;
            
            return `
                <div class="skill-assignment-item">
                    <div class="skill-info">
                        <span style="font-size: 1.2rem;">${skill.icon}</span>
                        <div>
                            <div style="font-weight: 600;">${skill.name}</div>
                            <div class="skill-category">${skill.category}</div>
                        </div>
                    </div>
                    
                    <div class="level-selector">
                        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-right: 0.5rem;">Level:</span>
                        ${Array.from({length: 5}, (_, i) => {
                            const level = i + 1;
                            return `<button class="level-btn ${level <= currentLevel ? 'active' : ''}" 
                                           onclick="app.setSkillLevel(${skill.id}, ${level})">${level}</button>`;
                        }).join('')}
                        <button class="level-btn" onclick="app.setSkillLevel(${skill.id}, 0)" 
                                style="margin-left: 0.5rem; background: var(--accent-secondary);">✕</button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.openModal('skillAssignModal');
    }

    // Set skill level for current member
    async setSkillLevel(skillId, level) {
        try {
            if (level === 0) {
                // Remove skill (not implemented in backend yet, but UI feedback)
                this.showNotification('🗑️ Skill removed');
            } else {
                const response = await fetch('/api/member-skills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        member_id: this.currentMemberId,
                        skill_id: skillId,
                        level: level
                    })
                });

                if (response.ok) {
                    await this.loadMembers();
                    this.renderMembers();
                    this.updateStats();
                    // Update the modal display
                    this.openSkillAssignment(this.currentMemberId);
                    this.showNotification(`⚡ Skill level updated to ${level}`);
                }
            }
        } catch (error) {
            console.error('Failed to update skill level:', error);
            this.showNotification('❌ Failed to update skill', 'error');
        }
    }

    // Modal management functions
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Show notification toast
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'var(--accent-secondary)' : 'var(--accent-success)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function openAddMemberModal() {
    app.openModal('addMemberModal');
}

function openAddSkillModal() {
    app.openModal('addSkillModal');
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

// Initialize the app when page loads
const app = new SkillMatrix();