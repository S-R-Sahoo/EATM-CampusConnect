import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions: 13.333" x 7.5"
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Path to official EATM branding assets
    cwd = os.getcwd()
    eatm_emblem_path = os.path.join(cwd, "public", "eatm-emblem.png")
    eatm_logo_path = os.path.join(cwd, "public", "eatm-official-logo.png")
    
    has_emblem = os.path.exists(eatm_emblem_path)
    
    # High-Contrast Professional Palette
    BG_DARK_HERO = RGBColor(6, 32, 18)       # #062012 Deep Forest Green
    DARK_GREEN   = RGBColor(11, 70, 39)      # #0B4627 Primary EATM Brand Dark Green
    EMERALD_BRIGHT = RGBColor(16, 185, 129)  # #10B981 Vibrant Accent Green
    MINT_BG      = RGBColor(240, 253, 244)   # #F0FDF4 Soft mint card background
    PURE_WHITE   = RGBColor(255, 255, 255)   # #FFFFFF Clean card background
    BG_LIGHT     = RGBColor(248, 250, 252)   # #F8FAFC Ultra-clean slide background
    TEXT_MAIN    = RGBColor(15, 23, 42)      # #0F172A Deep slate dark (High contrast for reading)
    TEXT_BODY    = RGBColor(51, 65, 85)      # #334155 Slate body text
    TEXT_MUTED   = RGBColor(100, 116, 139)   # #64748B Secondary / subtitle
    BORDER_LIGHT = RGBColor(203, 213, 225)   # #CBD5E1 High-contrast card border
    BORDER_GREEN = RGBColor(16, 185, 129)    # #10B981 Active green border
    RED_ACCENT   = RGBColor(220, 38, 38)     # #DC2626 EATM Red Flame Accent
    CARD_DARK    = RGBColor(12, 45, 27)      # #0C2D1B Card on dark background

    blank_layout = prs.slide_layouts[6]

    # --- UI Helper Functions ---
    def set_slide_bg(slide, color=BG_LIGHT):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="CAMPUSCONNECT • CSE MINOR PROJECT SEMINAR"):
        # Top Accent Ribbon
        ribbon = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.09))
        ribbon.fill.solid()
        ribbon.fill.fore_color.rgb = DARK_GREEN
        ribbon.line.fill.background()

        red_dot = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(12.3), 0, Inches(1.033), Inches(0.09))
        red_dot.fill.solid()
        red_dot.fill.fore_color.rgb = RED_ACCENT
        red_dot.line.fill.background()

        # Add Official EATM Emblem to slide header (top right)
        if has_emblem:
            try:
                slide.shapes.add_picture(eatm_emblem_path, Inches(12.2), Inches(0.28), Inches(0.65), Inches(0.65))
            except Exception:
                pass

        # Text Header Box
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.32), Inches(11.2), Inches(1.15))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p_cat = tf.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(12)
        p_cat.font.bold = True
        p_cat.font.color.rgb = EMERALD_BRIGHT
        p_cat.font.name = "Arial"
        p_cat.space_after = Pt(2)

        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = DARK_GREEN
        p_title.font.name = "Georgia"

    def add_card(slide, left, top, width, height, bg_color=PURE_WHITE, border_color=BORDER_LIGHT):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        return card

    def add_footer(slide, current_slide, total_slides=16):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.7), Inches(0.35))
        tf = tb.text_frame
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        p = tf.paragraphs[0]
        p.text = f"Einstein Academy of Technology & Management (EATM)  |  Department of CSE  |  Slide {current_slide} of {total_slides}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_MUTED
        p.font.name = "Arial"

    def set_speaker_notes(slide, text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = text

    # =========================================================================
    # SLIDE 1 — TITLE & TEAM COVER (Deep Dark Green Luxury Hero)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1, BG_DARK_HERO)

    # Top Red Accent Tag
    tag_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.5), Inches(0.5), Inches(2.1), Inches(0.38))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = RED_ACCENT
    tag_box.line.fill.background()
    tf_tag = tag_box.text_frame
    tf_tag.paragraphs[0].text = "MINOR PROJECT 2026"
    tf_tag.paragraphs[0].font.size = Pt(11)
    tf_tag.paragraphs[0].font.bold = True
    tf_tag.paragraphs[0].font.color.rgb = PURE_WHITE
    tf_tag.paragraphs[0].alignment = PP_ALIGN.CENTER

    # Embed Official EATM Emblem on Slide 1
    if has_emblem:
        try:
            s1.shapes.add_picture(eatm_emblem_path, Inches(0.8), Inches(0.5), Inches(1.25), Inches(1.25))
        except Exception:
            pass

    # Title & Subtitle block
    tb1 = s1.shapes.add_textbox(Inches(2.3), Inches(0.48), Inches(8.0), Inches(2.4))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p_inst = tf1.paragraphs[0]
    p_inst.text = "EINSTEIN ACADEMY OF TECHNOLOGY & MANAGEMENT (EATM)"
    p_inst.font.size = Pt(11)
    p_inst.font.bold = True
    p_inst.font.color.rgb = EMERALD_BRIGHT
    p_inst.font.name = "Arial"
    p_inst.space_after = Pt(4)

    p_main = tf1.add_paragraph()
    p_main.text = "CampusConnect"
    p_main.font.size = Pt(48)
    p_main.font.bold = True
    p_main.font.color.rgb = PURE_WHITE
    p_main.font.name = "Georgia"
    p_main.space_after = Pt(4)

    p_sub = tf1.add_paragraph()
    p_sub.text = "A Web-Based Social Networking & Academic Collaboration Platform"
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = RGBColor(209, 250, 229)
    p_sub.font.name = "Arial"
    p_sub.space_after = Pt(6)

    p_motto = tf1.add_paragraph()
    p_motto.text = "CONNECT  •  COLLABORATE  •  GROW"
    p_motto.font.size = Pt(14)
    p_motto.font.bold = True
    p_motto.font.color.rgb = EMERALD_BRIGHT
    p_motto.font.name = "Arial"

    # Team Members Section Title
    tb_team_title = s1.shapes.add_textbox(Inches(0.8), Inches(3.2), Inches(11.7), Inches(0.4))
    tf_tt = tb_team_title.text_frame
    p_tt = tf_tt.paragraphs[0]
    p_tt.text = "PROJECT TEAM MEMBERS (Department of Computer Science & Engineering)"
    p_tt.font.size = Pt(12)
    p_tt.font.bold = True
    p_tt.font.color.rgb = EMERALD_BRIGHT
    p_tt.font.name = "Arial"

    # 4 Team Members Cards (Large & Prominent)
    team_members = [
        ("Soumyaranjan Sahoo", "Lead Developer & System Architect"),
        ("Somit Rout", "Backend & Database Engineer"),
        ("Nihar Ranjan Singh", "Frontend & UI/UX Developer"),
        ("Nitish Kumar Panda", "QA & Module Integration")
    ]
    card_w = Inches(2.78)
    card_gap = Inches(0.2)
    left_start = Inches(0.8)

    for i, (name, role) in enumerate(team_members):
        cur_left = left_start + i * (card_w + card_gap)
        add_card(s1, cur_left, Inches(3.7), card_w, Inches(2.2), bg_color=CARD_DARK, border_color=RGBColor(16, 185, 129))
        tb_m = s1.shapes.add_textbox(cur_left + Inches(0.18), Inches(3.85), card_w - Inches(0.36), Inches(1.9))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True

        p_icon = tf_m.paragraphs[0]
        p_icon.text = "👨‍💻"
        p_icon.font.size = Pt(22)
        p_icon.space_after = Pt(6)

        p_name = tf_m.add_paragraph()
        p_name.text = name
        p_name.font.size = Pt(16)
        p_name.font.bold = True
        p_name.font.color.rgb = PURE_WHITE
        p_name.font.name = "Georgia"
        p_name.space_after = Pt(4)

        p_role = tf_m.add_paragraph()
        p_role.text = role
        p_role.font.size = Pt(11)
        p_role.font.color.rgb = RGBColor(167, 243, 208)
        p_role.font.name = "Arial"

    # Slide 1 Footer info
    tb_bot = s1.shapes.add_textbox(Inches(0.8), Inches(6.3), Inches(11.7), Inches(0.7))
    tf_bot = tb_bot.text_frame
    p_b = tf_bot.paragraphs[0]
    p_b.text = "Technology Stack: React 18 • TypeScript • Tailwind CSS • Supabase PostgreSQL • Realtime WebSocket Engine"
    p_b.font.size = Pt(12)
    p_b.font.color.rgb = RGBColor(209, 250, 229)
    p_b.font.name = "Arial"

    set_speaker_notes(s1,
        "Good morning respected panel members, faculty guide, and fellow peers. "
        "We are proud to present our Computer Science Minor Project: CampusConnect — a unified web platform built specifically for college communities like EATM. "
        "Our team consists of Soumyaranjan Sahoo, Somit Rout, Nihar Ranjan Singh, and Nitish Kumar Panda. "
        "Our mission is to replace fragmented communication with a high-performance digital campus under the motto: Connect, Collaborate, Grow."
    )

    # =========================================================================
    # SLIDE 2 — EXECUTIVE SUMMARY & MOTIVATION
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2, BG_LIGHT)
    add_header(s2, "Executive Summary: Why CampusConnect Matters", "01 / PROJECT OVERVIEW")

    # 3 Large High-Contrast Cards
    cards_s2 = [
        ("🏢", "Central Digital Intranet", 
         "Replaces chaotic, unorganized WhatsApp groups with a single verified institutional hub for announcements, discussions, and student networking."),
        ("🤝", "Cross-Branch Synergy", 
         "Bridges the communication gap across CSE, EE, Mechanical, and Civil departments to easily discover hackathon teammates and project partners."),
        ("📚", "Curated Knowledge Bank", 
         "Delivers structured semester and branch-wise access to verified lecture notes, previous year question papers (PYQs), and faculty resources.")
    ]

    card2_w = Inches(3.72)
    card2_gap = Inches(0.28)
    for i, (icon, title, desc) in enumerate(cards_s2):
        c_left = Inches(0.8) + i * (card2_w + card2_gap)
        add_card(s2, c_left, Inches(1.8), card2_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
        
        # Inner text
        tb = s2.shapes.add_textbox(c_left + Inches(0.3), Inches(2.1), card2_w - Inches(0.6), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_ic = tf.paragraphs[0]
        p_ic.text = icon
        p_ic.font.size = Pt(36)
        p_ic.space_after = Pt(14)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(20)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(14)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(15)
        p_d.font.color.rgb = TEXT_BODY
        p_d.font.name = "Arial"
        p_d.space_after = Pt(10)

    add_footer(s2, 2)
    set_speaker_notes(s2,
        "Every college campus suffers from fragmented communication. Notices are sent over WhatsApp, hackathons go unnoticed, and study materials are scattered across temporary Google Drive links. "
        "CampusConnect solves this by serving as an all-in-one digital intranet connecting every student, faculty member, and academic club under verified institutional profiles."
    )

    # =========================================================================
    # SLIDE 3 — THE PROBLEM STATEMENT
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3, BG_LIGHT)
    add_header(s3, "Current Campus Communication Gaps", "02 / PROBLEM STATEMENT")

    problems = [
        ("📢", "Noisy & Fragmented Channels", "Crucial circulars, exams schedules, and assignments get buried in informal chat threads with zero searchability or indexing."),
        ("🔍", "Isolated Department Silos", "Students cannot discover technical peers or complementary skills from other branches to build capstone or hackathon teams."),
        ("📁", "Scattered Study Notes", "Lecture materials and previous-year question papers are hosted on fragile personal drives that get deleted after semesters."),
        ("❌", "Zero Verification & Accountability", "Informal social media groups lack academic verification, role distinctions, and official faculty oversight.")
    ]

    # 2x2 High-Contrast Grid
    w_p = Inches(5.7)
    h_p = Inches(2.35)
    coords_p = [
        (Inches(0.8), Inches(1.8)),
        (Inches(6.8), Inches(1.8)),
        (Inches(0.8), Inches(4.45)),
        (Inches(6.8), Inches(4.45))
    ]

    for (icon, title, desc), (l, t) in zip(problems, coords_p):
        add_card(s3, l, t, w_p, h_p, bg_color=PURE_WHITE, border_color=RGBColor(254, 202, 202))
        tb = s3.shapes.add_textbox(l + Inches(0.28), t + Inches(0.22), w_p - Inches(0.56), h_p - Inches(0.44))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon}  {title}"
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = RED_ACCENT
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s3, 3)
    set_speaker_notes(s3,
        "Through our surveys and student feedback at EATM, we identified four severe communication pain points: "
        "Information noise on WhatsApp, severe inter-branch silos, lost study materials, and no faculty moderation. "
        "These gaps directly degrade student engagement and academic collaboration."
    )

    # =========================================================================
    # SLIDE 4 — OUR SOLUTION (CampusConnect Ecosystem)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4, BG_LIGHT)
    add_header(s4, "Our Solution: The Unified Campus Ecosystem", "03 / PROPOSED SOLUTION")

    solutions = [
        ("🌐", "Verified Social Feed", "Share academic milestones, project demos, and code snippets with live syntax highlighting and instant reactions."),
        ("💬", "Real-Time Chat Engine", "Instant 0ms direct & group messaging powered by Supabase WebSockets, featuring live voice notes with waveform preview."),
        ("📚", "Central Resource Vault", "Faculty-approved digital library categorized by semester and department with one-click PDF downloads."),
        ("🎪", "Clubs & Events Portal", "Comprehensive college event calendar with 1-click RSVP for hackathons, workshops, and symposiums.")
    ]

    for (icon, title, desc), (l, t) in zip(solutions, coords_p):
        add_card(s4, l, t, w_p, h_p, bg_color=PURE_WHITE, border_color=BORDER_GREEN)
        tb = s4.shapes.add_textbox(l + Inches(0.28), t + Inches(0.22), w_p - Inches(0.56), h_p - Inches(0.44))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon}  {title}"
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s4, 4)
    set_speaker_notes(s4,
        "CampusConnect consolidates these four essential pillars into a unified web application: "
        "A social feed for technical discussions, real-time messaging with audio notes, a structured academic repository, and an automated event hub."
    )

    # =========================================================================
    # SLIDE 5 — USER JOURNEY & WORKFLOW
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5, BG_LIGHT)
    add_header(s5, "End-to-End User Experience & Flow", "04 / USER WORKFLOW")

    steps = [
        ("01", "Sign Up", "College email authentication & role selection."),
        ("02", "Profile", "Showcase department, batch, skills & bio."),
        ("03", "Discover", "Search peers by branch, year & tech stack."),
        ("04", "Connect", "Send connection requests to unlock chat."),
        ("05", "Collaborate", "Join clubs, share notes & message in real-time.")
    ]

    card_s5_w = Inches(2.2)
    card_s5_gap = Inches(0.18)
    for i, (num, title, desc) in enumerate(steps):
        s_left = Inches(0.8) + i * (card_s5_w + card_s5_gap)
        add_card(s5, s_left, Inches(1.8), card_s5_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)

        tb = s5.shapes.add_textbox(s_left + Inches(0.18), Inches(2.0), card_s5_w - Inches(0.36), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = num
        p_num.font.size = Pt(32)
        p_num.font.bold = True
        p_num.font.color.rgb = EMERALD_BRIGHT
        p_num.font.name = "Georgia"
        p_num.space_after = Pt(12)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(10)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s5, 5)
    set_speaker_notes(s5,
        "Here is the 5-step user lifecycle. Students register with their verified college identity, customize their skill profiles, discover peers, establish bilateral connections, and immediately begin collaborating on projects."
    )

    # =========================================================================
    # SLIDE 6 — ROLE-BASED ACCESS CONTROL (RBAC Matrix)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6, BG_LIGHT)
    add_header(s6, "User Roles & Granular Academic Permissions", "05 / ACCESS CONTROL")

    roles = [
        ("👨‍🎓", "Student Role", [
            "Build verified academic profile & portfolio",
            "Connect with peers across all engineering branches",
            "Participate in interest clubs & direct/group chat",
            "Share code snippets & download study materials"
        ]),
        ("👩‍🏫", "Faculty Role", [
            "Verified faculty badge on public profile",
            "Broadcast official departmental announcements",
            "Upload approved lecture notes, syllabus & PYQs",
            "Conduct student mentoring & group discussions"
        ]),
        ("🛡️", "Administrator Role", [
            "Manage user account verification & role claims",
            "Content moderation & platform safety controls",
            "Oversee institution-wide fests & hackathons",
            "Enforce database-level Row Level Security policies"
        ])
    ]

    card6_w = Inches(3.72)
    card6_gap = Inches(0.28)
    for i, (icon, title, points) in enumerate(roles):
        c_left = Inches(0.8) + i * (card6_w + card6_gap)
        add_card(s6, c_left, Inches(1.8), card6_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)

        tb = s6.shapes.add_textbox(c_left + Inches(0.25), Inches(2.0), card6_w - Inches(0.5), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon} {title}"
        p_t.font.size = Pt(20)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(14)

        for pt in points:
            p_pt = tf.add_paragraph()
            p_pt.text = f"✔  {pt}"
            p_pt.font.size = Pt(14)
            p_pt.font.color.rgb = TEXT_MAIN
            p_pt.font.name = "Arial"
            p_pt.space_after = Pt(8)

    add_footer(s6, 6)
    set_speaker_notes(s6,
        "CampusConnect is built on strict Role-Based Access Control. Students have full networking and learning tools; faculty members hold elevated publishing and mentoring privileges; and administrators enforce moderation and security policies."
    )

    # =========================================================================
    # SLIDE 7 — SOCIAL FEED & PEER DISCOVERY
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7, BG_LIGHT)
    add_header(s7, "Campus Social Feed & Smart Peer Discovery", "06 / NETWORKING MODULE")

    w_half = Inches(5.7)
    # Left Card: Feed
    add_card(s7, Inches(0.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_GREEN)
    tb_l = s7.shapes.add_textbox(Inches(1.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True

    p_tl = tf_l.paragraphs[0]
    p_tl.text = "📰 Campus Social Feed"
    p_tl.font.size = Pt(22)
    p_tl.font.bold = True
    p_tl.font.color.rgb = DARK_GREEN
    p_tl.font.name = "Georgia"
    p_tl.space_after = Pt(14)

    feed_points = [
        "Code Syntax Highlighting: Native formatting for Python, C++, Java, JS.",
        "Optimistic UI Reactions: 0ms latency for post likes, bookmarks & comments.",
        "Project Pinning: Highlight major capstone projects directly on profiles.",
        "Categorized Feeds: Filter posts by #CSE, #Hackathon, #Placements, #Robotics."
    ]
    for pt in feed_points:
        p_pt = tf_l.add_paragraph()
        p_pt.text = f"★  {pt}"
        p_pt.font.size = Pt(14.5)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(10)

    # Right Card: Discover
    add_card(s7, Inches(6.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
    tb_r = s7.shapes.add_textbox(Inches(7.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p_tr = tf_r.paragraphs[0]
    p_tr.text = "🔍 Smart Peer Discovery"
    p_tr.font.size = Pt(22)
    p_tr.font.bold = True
    p_tr.font.color.rgb = DARK_GREEN
    p_tr.font.name = "Georgia"
    p_tr.space_after = Pt(14)

    disc_points = [
        "Multi-Faceted Search: Filter peers by branch, year of study, and technical skills.",
        "Verified Connection Lifecycle: View Profile ➔ Request ➔ Accept ➔ Connected.",
        "Instant Chat Access: Accepting connection automatically provisions private chat room.",
        "Directory Privacy: Only connected students can start direct messaging."
    ]
    for pt in disc_points:
        p_pt = tf_r.add_paragraph()
        p_pt.text = f"★  {pt}"
        p_pt.font.size = Pt(14.5)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(10)

    add_footer(s7, 7)
    set_speaker_notes(s7,
        "Our social feed is tailored for engineering students with embedded code highlighting and fast optimistic interactions. "
        "The peer discovery tool enables students to locate teammates across branches and send connection requests that seamlessly transition into real-time chats."
    )

    # =========================================================================
    # SLIDE 8 — REAL-TIME MESSAGING & VOICE NOTES
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8, BG_LIGHT)
    add_header(s8, "Real-Time WebSocket Messaging & Audio Notes", "07 / CHAT ENGINE")

    chat_features = [
        ("⚡", "Zero-Latency Messaging", "Powered by Supabase Realtime WebSockets with client deduplication and instant message delivery."),
        ("🎙️", "In-Browser Voice Notes", "Record high-fidelity audio messages with real-time waveform visualizer and inline audio player."),
        ("🟢", "Live Online Presence", "Displays live online status indicators and typing state in both direct and group conversations."),
        ("📬", "Numeric Unread Badges", "WhatsApp-style green unread count pills that automatically synchronize and clear upon reading.")
    ]

    for (icon, title, desc), (l, t) in zip(chat_features, coords_p):
        add_card(s8, l, t, w_p, h_p, bg_color=PURE_WHITE, border_color=BORDER_GREEN)
        tb = s8.shapes.add_textbox(l + Inches(0.28), t + Inches(0.22), w_p - Inches(0.56), h_p - Inches(0.44))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon}  {title}"
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s8, 8)
    set_speaker_notes(s8,
        "The messaging system delivers a modern chat experience. It features Supabase WebSockets for instantaneous delivery, integrated voice recording with animated waveforms, live presence indicators, and automatic unread counter badge management."
    )

    # =========================================================================
    # SLIDE 9 — ACADEMIC VAULT & COMMUNITIES
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9, BG_LIGHT)
    add_header(s9, "Academic Study Vault & Student Communities", "08 / ACADEMIC HUB")

    # Left: Study Library
    add_card(s9, Inches(0.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
    tb_l9 = s9.shapes.add_textbox(Inches(1.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_l9 = tb_l9.text_frame
    tf_l9.word_wrap = True

    p_tl9 = tf_l9.paragraphs[0]
    p_tl9.text = "📚 Digital Study Library"
    p_tl9.font.size = Pt(22)
    p_tl9.font.bold = True
    p_tl9.font.color.rgb = DARK_GREEN
    p_tl9.font.name = "Georgia"
    p_tl9.space_after = Pt(14)

    library_points = [
        "Department & Semester Filters: Easy navigation across CSE, EE, Civil, Mech (Semesters 1–8).",
        "Curated Materials: Lecture slides, PDF notes, syllabus copies, and lab manuals.",
        "Previous Year Questions (PYQs): Solved semester question papers with one-click download.",
        "Faculty Validation: Uploads verified by subject teachers for academic authenticity."
    ]
    for pt in library_points:
        p_pt = tf_l9.add_paragraph()
        p_pt.text = f"✔  {pt}"
        p_pt.font.size = Pt(14)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(10)

    # Right: Communities
    add_card(s9, Inches(6.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
    tb_r9 = s9.shapes.add_textbox(Inches(7.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_r9 = tb_r9.text_frame
    tf_r9.word_wrap = True

    p_tr9 = tf_r9.paragraphs[0]
    p_tr9.text = "🚀 Student Communities"
    p_tr9.font.size = Pt(22)
    p_tr9.font.bold = True
    p_tr9.font.color.rgb = DARK_GREEN
    p_tr9.font.name = "Georgia"
    p_tr9.space_after = Pt(14)

    club_points = [
        "Club Spaces: Dedicated hubs for Robotics Club, Coding Society, and AI forums.",
        "Nested Collaboration: Built-in discussions, shared code repositories, and event timelines.",
        "Group Chat: Community-wide messaging for meeting announcements and doubt clearing.",
        "Knowledge Preservation: Project archives accessible to junior batches across years."
    ]
    for pt in club_points:
        p_pt = tf_r9.add_paragraph()
        p_pt.text = f"✔  {pt}"
        p_pt.font.size = Pt(14)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(10)

    add_footer(s9, 9)
    set_speaker_notes(s9,
        "The academic vault provides verified, branch-specific study materials with fast downloads. "
        "The student communities module empowers college clubs like the Robotics Club to maintain discussions, shared code assets, and event calendars in one dedicated space."
    )

    # =========================================================================
    # SLIDE 10 — EVENTS & OPPORTUNITIES BOARD
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10, BG_LIGHT)
    add_header(s10, "Campus Events & Opportunities Board", "09 / EVENTS & CAREERS")

    event_cards = [
        ("💻", "Hackathons & Contests", 
         "Promotes inter-college competitions with automated team matchmaking across branches to ensure balanced technical skill sets."),
        ("🎪", "Symposiums & Fests", 
         "Central calendar for tech fests, workshops, and seminars with 1-click RSVP and live schedule updates to eliminate missed deadlines."),
        ("💼", "Placement & Internship Board", 
         "Direct channel for Training & Placement cell notifications, internship openings, and company drive eligibility criteria.")
    ]

    for i, (icon, title, desc) in enumerate(event_cards):
        c_left = Inches(0.8) + i * (card2_w + card2_gap)
        add_card(s10, c_left, Inches(1.8), card2_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)

        tb = s10.shapes.add_textbox(c_left + Inches(0.28), Inches(2.1), card2_w - Inches(0.56), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_ic = tf.paragraphs[0]
        p_ic.text = icon
        p_ic.font.size = Pt(36)
        p_ic.space_after = Pt(14)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(20)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(14)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(15)
        p_d.font.color.rgb = TEXT_BODY
        p_d.font.name = "Arial"

    add_footer(s10, 10)
    set_speaker_notes(s10,
        "The Events and Opportunities board solves the problem of missed hackathons and placement circulars. Students can discover upcoming symposiums, RSVP with one click, and form teams directly through the platform."
    )

    # =========================================================================
    # SLIDE 11 — THREE-TIER TECHNICAL ARCHITECTURE
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s11, BG_LIGHT)
    add_header(s11, "Three-Tier Scalable System Architecture", "10 / TECHNICAL DESIGN")

    tiers = [
        ("💻", "Presentation Layer", [
            "React 18 Single Page Application (SPA)",
            "TypeScript 5 for strict type safety",
            "Tailwind CSS for responsive styling",
            "Dynamic 100dvh viewport locking for mobile"
        ]),
        ("⚡", "State & Application Layer", [
            "React Context API (Auth, Theme, Notifs)",
            "30-Second TTL in-memory caching engine",
            "LocalStorage instant fallback cache",
            "Optimistic UI state updater (0ms response)"
        ]),
        ("🗄️", "Backend & Database Layer", [
            "Supabase PostgreSQL 15 Relational DB",
            "Realtime WebSocket Channel Bus",
            "Database-enforced Row Level Security",
            "Secure Cloud Storage for documents & media"
        ])
    ]

    for i, (icon, title, points) in enumerate(tiers):
        c_left = Inches(0.8) + i * (card2_w + card2_gap)
        add_card(s11, c_left, Inches(1.8), card2_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_GREEN)

        tb = s11.shapes.add_textbox(c_left + Inches(0.25), Inches(2.0), card2_w - Inches(0.5), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon} {title}"
        p_t.font.size = Pt(19)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(14)

        for pt in points:
            p_pt = tf.add_paragraph()
            p_pt.text = f"•  {pt}"
            p_pt.font.size = Pt(14)
            p_pt.font.color.rgb = TEXT_MAIN
            p_pt.font.name = "Arial"
            p_pt.space_after = Pt(8)

    add_footer(s11, 11)
    set_speaker_notes(s11,
        "Here is our production architecture. The frontend is built on React 18 and TypeScript; the application layer leverages optimistic UI updates and in-memory caching; and the backend utilizes Supabase PostgreSQL 15 and WebSocket replication."
    )

    # =========================================================================
    # SLIDE 12 — SECURITY: AUTHENTICATION VS AUTHORIZATION
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s12, BG_LIGHT)
    add_header(s12, "Enterprise Security: Authentication vs Authorization", "11 / SECURITY MODEL")

    # Left: Authentication
    add_card(s12, Inches(0.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
    tb_l12 = s12.shapes.add_textbox(Inches(1.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_l12 = tb_l12.text_frame
    tf_l12.word_wrap = True

    p_tl12 = tf_l12.paragraphs[0]
    p_tl12.text = "🔐 Authentication (Who You Are)"
    p_tl12.font.size = Pt(21)
    p_tl12.font.bold = True
    p_tl12.font.color.rgb = DARK_GREEN
    p_tl12.font.name = "Georgia"
    p_tl12.space_after = Pt(14)

    auth_pts = [
        "Supabase Auth Engine: Encrypted JWT-backed sessions with secure token refresh.",
        "Role Claim Embedding: Institutional role (Student, Faculty, Admin) signed inside session.",
        "Client Route Guards: Protected navigation trees preventing unauthorized route access."
    ]
    for pt in auth_pts:
        p_pt = tf_l12.add_paragraph()
        p_pt.text = f"✔  {pt}"
        p_pt.font.size = Pt(14.5)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(12)

    # Right: Authorization (RLS)
    add_card(s12, Inches(6.8), Inches(1.8), w_half, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_GREEN)
    tb_r12 = s12.shapes.add_textbox(Inches(7.1), Inches(2.1), w_half - Inches(0.6), Inches(4.3))
    tf_r12 = tb_r12.text_frame
    tf_r12.word_wrap = True

    p_tr12 = tf_r12.paragraphs[0]
    p_tr12.text = "🛡️ Authorization (What You Can Do)"
    p_tr12.font.size = Pt(21)
    p_tr12.font.bold = True
    p_tr12.font.color.rgb = DARK_GREEN
    p_tr12.font.name = "Georgia"
    p_tr12.space_after = Pt(14)

    authz_pts = [
        "PostgreSQL Row Level Security (RLS): Policies enforced directly inside the database kernel.",
        "Multi-Tenant Isolation: Users can strictly query and mutate only permitted records.",
        "Private Message Isolation: Chat records are cryptographically inaccessible to non-participants."
    ]
    for pt in authz_pts:
        p_pt = tf_r12.add_paragraph()
        p_pt.text = f"✔  {pt}"
        p_pt.font.size = Pt(14.5)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.font.name = "Arial"
        p_pt.space_after = Pt(12)

    add_footer(s12, 12)
    set_speaker_notes(s12,
        "Security is implemented in depth. While Supabase Auth verifies user credentials and issues signed JWT tokens, PostgreSQL Row Level Security enforces database-level authorization policies so that data privacy cannot be bypassed from the client."
    )

    # =========================================================================
    # SLIDE 13 — DATABASE SCHEMA & RELATIONAL DESIGN
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s13, BG_LIGHT)
    add_header(s13, "Relational Database Schema (12 Tables)", "12 / DATABASE DESIGN")

    db_groups = [
        ("👤 Identity & Profiles", "profiles, auth.users", "User roles, department, semester, bio, avatar, and technical skills."),
        ("💬 Real-Time Chat", "conversations, messages", "Direct/group chat metadata, message text, media URLs, audio waveforms & timestamps."),
        ("🌐 Campus Social Feed", "posts, comments, likes", "Feed posts, code snippets, user reactions, timestamps, and threaded comments."),
        ("📚 Academic Resources", "study_materials, events", "Department/semester study notes, question banks, symposiums & RSVP records.")
    ]

    for (title, tables, desc), (l, t) in zip(db_groups, coords_p):
        add_card(s13, l, t, w_p, h_p, bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
        tb = s13.shapes.add_textbox(l + Inches(0.28), t + Inches(0.2), w_p - Inches(0.56), h_p - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(4)

        p_tb = tf.add_paragraph()
        p_tb.text = f"Tables: {tables}"
        p_tb.font.size = Pt(13)
        p_tb.font.bold = True
        p_tb.font.color.rgb = EMERALD_BRIGHT
        p_tb.font.name = "Arial"
        p_tb.space_after = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s13, 13)
    set_speaker_notes(s13,
        "Our PostgreSQL database schema is fully normalized into 12 core tables across 4 functional domains: User Identity, Real-Time Chat, Social Feed, and Academic Study Resources."
    )

    # =========================================================================
    # SLIDE 14 — TECHNOLOGY STACK SUMMARY
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s14, BG_LIGHT)
    add_header(s14, "Implemented Production Technology Stack", "13 / TECH STACK")

    stack = [
        ("⚛️", "React 18", "Single-Page Application frontend with modular reusable components."),
        ("🔷", "TypeScript 5", "Strict static type validation for bug prevention and maintainability."),
        ("🎨", "Tailwind CSS", "Modern responsive styling and custom typography system."),
        ("⚡", "Supabase Realtime", "WebSocket channel bus delivering instant 0ms chat synchronization."),
        ("🐘", "PostgreSQL 15", "ACID-compliant relational database with kernel-level RLS policies."),
        ("⚡", "Vite 6 Bundler", "Lightning-fast HMR and optimized production asset compilation.")
    ]

    card_s14_w = Inches(3.72)
    card_s14_h = Inches(2.35)
    coords_s14 = [
        (Inches(0.8), Inches(1.8)),
        (Inches(4.8), Inches(1.8)),
        (Inches(8.8), Inches(1.8)),
        (Inches(0.8), Inches(4.45)),
        (Inches(4.8), Inches(4.45)),
        (Inches(8.8), Inches(4.45))
    ]

    for (icon, name, role), (l, t) in zip(stack, coords_s14):
        add_card(s14, l, t, card_s14_w, card_s14_h, bg_color=PURE_WHITE, border_color=BORDER_LIGHT)
        tb = s14.shapes.add_textbox(l + Inches(0.25), t + Inches(0.2), card_s14_w - Inches(0.5), card_s14_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{icon}  {name}"
        p_t.font.size = Pt(19)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = role
        p_d.font.size = Pt(13.5)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.font.name = "Arial"

    add_footer(s14, 14)
    set_speaker_notes(s14,
        "Every technology listed here is fully implemented in our codebase. We chose React 18, TypeScript, Tailwind CSS, Supabase Realtime, and PostgreSQL 15 for high reliability and exceptional performance."
    )

    # =========================================================================
    # SLIDE 15 — FUTURE SCOPE & EXPANSION ROADMAP
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s15, BG_LIGHT)
    add_header(s15, "Proposed Future Scope & Platform Roadmap", "14 / ROADMAP")

    future_cards = [
        ("🤖", "Gemini AI Academic Tutor", 
         "Integrate Google Gemini API for automated doubt resolution, code debugging, and instant summarization of research papers and lecture slides."),
        ("📊", "College ERP & Attendance Sync", 
         "Bi-directional synchronization with institutional ERP for automated semester attendance tracking, internal marks, and exam admit card generation."),
        ("🎓", "Alumni Mentorship Network", 
         "A dedicated verified portal connecting pre-final and final-year students with alumni working across premier technology and research organizations.")
    ]

    for i, (icon, title, desc) in enumerate(future_cards):
        c_left = Inches(0.8) + i * (card2_w + card2_gap)
        add_card(s15, c_left, Inches(1.8), card2_w, Inches(4.9), bg_color=PURE_WHITE, border_color=BORDER_GREEN)

        tb = s15.shapes.add_textbox(c_left + Inches(0.28), Inches(2.1), card2_w - Inches(0.56), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_ic = tf.paragraphs[0]
        p_ic.text = icon
        p_ic.font.size = Pt(36)
        p_ic.space_after = Pt(14)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(20)
        p_t.font.bold = True
        p_t.font.color.rgb = DARK_GREEN
        p_t.font.name = "Georgia"
        p_t.space_after = Pt(14)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(15)
        p_d.font.color.rgb = TEXT_BODY
        p_d.font.name = "Arial"

    add_footer(s15, 15)
    set_speaker_notes(s15,
        "Looking forward, our roadmap includes integrating Gemini AI for automated academic tutoring, syncing with college ERP systems for automated attendance, and launching an alumni mentorship network."
    )

    # =========================================================================
    # SLIDE 16 — CONCLUSION & TEAM CREDITS (Deep Dark Green Luxury Hero)
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s16, BG_DARK_HERO)

    # Embed Official EATM Emblem on Conclusion Slide
    if has_emblem:
        try:
            s16.shapes.add_picture(eatm_emblem_path, Inches(0.8), Inches(0.5), Inches(1.25), Inches(1.25))
        except Exception:
            pass

    tb16 = s16.shapes.add_textbox(Inches(2.3), Inches(0.48), Inches(10.0), Inches(2.2))
    tf16 = tb16.text_frame
    tf16.word_wrap = True
    tf16.margin_left = tf16.margin_top = tf16.margin_right = tf16.margin_bottom = 0

    p_c_cat = tf16.paragraphs[0]
    p_c_cat.text = "CONCLUSION & ACKNOWLEDGMENTS"
    p_c_cat.font.size = Pt(12)
    p_c_cat.font.bold = True
    p_c_cat.font.color.rgb = EMERALD_BRIGHT
    p_c_cat.font.name = "Arial"
    p_c_cat.space_after = Pt(4)

    p_c_t = tf16.add_paragraph()
    p_c_t.text = "Building a Connected Digital Campus for EATM"
    p_c_t.font.size = Pt(32)
    p_c_t.font.bold = True
    p_c_t.font.color.rgb = PURE_WHITE
    p_c_t.font.name = "Georgia"
    p_c_t.space_after = Pt(6)

    p_c_sub = tf16.add_paragraph()
    p_c_sub.text = "CampusConnect successfully delivers a modern, high-speed, and secure intranet for students & faculty."
    p_c_sub.font.size = Pt(15)
    p_c_sub.font.color.rgb = RGBColor(209, 250, 229)
    p_c_sub.font.name = "Arial"

    # Team Box on Slide 16
    for i, (name, role) in enumerate(team_members):
        cur_left = left_start + i * (card_w + card_gap)
        add_card(s16, cur_left, Inches(2.9), card_w, Inches(2.3), bg_color=CARD_DARK, border_color=RGBColor(16, 185, 129))
        tb_m = s16.shapes.add_textbox(cur_left + Inches(0.18), Inches(3.05), card_w - Inches(0.36), Inches(2.0))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True

        p_icon = tf_m.paragraphs[0]
        p_icon.text = "👨‍💻"
        p_icon.font.size = Pt(22)
        p_icon.space_after = Pt(6)

        p_name = tf_m.add_paragraph()
        p_name.text = name
        p_name.font.size = Pt(16)
        p_name.font.bold = True
        p_name.font.color.rgb = PURE_WHITE
        p_name.font.name = "Georgia"
        p_name.space_after = Pt(4)

        p_role = tf_m.add_paragraph()
        p_role.text = role
        p_role.font.size = Pt(11)
        p_role.font.color.rgb = RGBColor(167, 243, 208)
        p_role.font.name = "Arial"

    # Slide 16 Bottom Call to Action
    tb_thank = s16.shapes.add_textbox(Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.3))
    tf_thank = tb_thank.text_frame
    tf_thank.word_wrap = True

    p_th = tf_thank.paragraphs[0]
    p_th.text = "CONNECT  •  COLLABORATE  •  GROW"
    p_th.font.size = Pt(18)
    p_th.font.bold = True
    p_th.font.color.rgb = EMERALD_BRIGHT
    p_th.font.name = "Georgia"
    p_th.space_after = Pt(4)

    p_qa = tf_thank.add_paragraph()
    p_qa.text = "Thank you for your time and attention! We welcome any questions and feedback from the panel."
    p_qa.font.size = Pt(15)
    p_qa.font.color.rgb = PURE_WHITE
    p_qa.font.name = "Arial"

    set_speaker_notes(s16,
        "In conclusion, CampusConnect unites social engagement, academic rigor, and real-time communication into a single secure platform for EATM. "
        "On behalf of Soumyaranjan Sahoo, Somit Rout, Nihar Ranjan Singh, and Nitish Kumar Panda, thank you for your time. "
        "We are now ready for your questions and live demonstration."
    )

    # Save to disk with fallback
    out_file = os.path.join(os.getcwd(), "CampusConnect_Minor_Project_Presentation.pptx")
    alt_out_file = os.path.join(os.getcwd(), "CampusConnect_Minor_Project_Presentation_EATM.pptx")
    try:
        prs.save(out_file)
        print(f"[SUCCESS] Saved presentation to: {out_file}")
    except PermissionError:
        try:
            prs.save(alt_out_file)
            print(f"[NOTICE] 'CampusConnect_Minor_Project_Presentation.pptx' is open in PowerPoint.")
            print(f"[SUCCESS] Saved updated version to: {alt_out_file}")
        except Exception as e:
            print(f"[ERROR] Could not save presentation: {e}")

if __name__ == "__main__":
    create_deck()
