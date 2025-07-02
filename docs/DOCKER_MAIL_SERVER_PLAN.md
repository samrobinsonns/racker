# Docker Mail Server Implementation Plan for Support Ticket System

## Overview

This document outlines the plan to implement a Docker-based mail server for handling inbound emails in the Support Ticket System, while allowing tenants to use their own SMTP settings for outbound emails. This hybrid approach enables full control and testing of inbound email flows, supports customer branding for outbound messages, and provides a scalable, secure, and multi-tenant-ready architecture.

---

## 1. Current State Analysis
- **Tenant-specific SMTP configuration** for outbound emails (branding, deliverability)
- **Mailpit** for development email testing
- **Comprehensive email processing pipeline** in Laravel

---

## 2. Proposed Solution: Hybrid Email Architecture

### 2.1 Docker Mail Server for Inbound Processing
- **Recommended:** Mailu (full-featured, Docker-native, web UI, spam filtering, REST API)
- **Alternative:** Postfix + Dovecot (customizable, more manual setup)

### 2.2 Architecture Diagram

```
Customer SMTP (outbound) <----> Docker Mail Server (inbound) <----> Laravel App (Support Ticket System)
```
- Outbound: Customers use their own SMTP for sending
- Inbound: All replies and new tickets routed through Docker mail server

---

## 3. Implementation Plan

### Phase 1: Docker Mail Server Setup
- Deploy Mailu (or Postfix/Dovecot) via Docker Compose
- Configure domains, SSL, admin access
- Set up per-tenant inbound addresses (e.g., tenant-123@mail.yourdomain.com)

### Phase 2: Email Processing Pipeline
- **Reception:**
  - Webhook (Mailu API calls Laravel endpoint)
  - IMAP polling (Laravel polls Mailu for new mail)
  - File monitoring (Laravel watches maildir for new .eml files)
- **Parsing:**
  - Extract sender, subject, body, attachments
  - Match to existing ticket or create new
  - Log processing results

### Phase 3: Integration with Support Ticket System
- Extend existing email processing services to support both Microsoft 365 and Docker mail server sources
- Add configuration options to `EmailSetting` model for inbound mail server usage
- UI: Allow tenants to view/manage their inbound email address

### Phase 4: Configuration Management
- Update tenant admin UI to show/hide Docker mail server options
- Add backend logic to generate/manage per-tenant inbound addresses
- Store and display processing logs

---

## 4. Technical Details

### 4.1 Docker Compose Example (Mailu)
```yaml
mailu:
  image: mailu/nginx:1.9
  ports:
    - "25:25"
    - "587:587"
    - "993:993"
    - "995:995"
    - "8080:80"
  environment:
    - DOMAIN=yourdomain.com
    - HOSTNAME=mail.yourdomain.com
    - POSTMASTER=admin
    - ADMIN_PASSWORD=secure_password
  volumes:
    - mailu_data:/data
    - mailu_config:/config
```

### 4.2 Database Schema Updates
- Add to `email_settings`:
  - `use_docker_mail_server` (bool)
  - `inbound_email_domain` (string)
  - `inbound_email_address` (string)
  - `docker_mail_configured_at` (timestamp)
- New table: `email_processing_logs` for tracking inbound email events

### 4.3 Environment Variables
```
DOCKER_MAIL_ENABLED=true
DOCKER_MAIL_DOMAIN=mail.yourdomain.com
DOCKER_MAIL_WEBHOOK_SECRET=your_webhook_secret
DOCKER_MAIL_IMAP_HOST=mail.yourdomain.com
DOCKER_MAIL_IMAP_PORT=993
DOCKER_MAIL_IMAP_USERNAME=admin
DOCKER_MAIL_IMAP_PASSWORD=secure_password
EMAIL_PROCESSING_METHOD=webhook  # or imap, file_monitor
EMAIL_PROCESSING_INTERVAL=30      # seconds
```

---

## 5. Benefits
- **Development:** Full end-to-end email flow testing, no external dependencies
- **Production:** Customer branding for outbound, centralized inbound processing, spam filtering, archiving
- **Multi-Tenancy:** Per-tenant isolation, custom addresses, centralized management

---

## 6. Security & Monitoring
- TLS for all email traffic
- Secure webhooks (secret tokens)
- Spam/virus filtering (Mailu)
- Rate limiting and abuse prevention
- Audit logging for all email events
- Health checks and backup strategies

---

## 7. Implementation Timeline
- **Week 1:** Docker mail server setup, domain config, basic flow test
- **Week 2:** Email processing integration (webhook/IMAP), Laravel service updates
- **Week 3:** Tenant config management, UI updates, address management
- **Week 4:** End-to-end testing, optimization, documentation

---

## 8. Next Steps
- Choose Mailu or Postfix/Dovecot for Docker mail server
- Set up Docker Compose and test inbound email flow
- Implement Laravel integration (webhook/IMAP/file monitor)
- Update tenant configuration and UI
- Test and document the full workflow

---

**This plan enables robust, testable, and scalable email handling for your multi-tenant support ticket system.** 