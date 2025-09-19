import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../Home/Home.module.css";

export default function Payment() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const amountMinor = Number(search.get("amountMinor") || 0);
  const currency = search.get("currency") || "AED";
  const title = search.get("title") || "Payment";
  const description = search.get("description") || "";

  const amountMajor = useMemo(() => (amountMinor / 100).toFixed(2), [amountMinor]);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const cardOk = card.number.replace(/\s+/g, "").length >= 12 && /^(0[1-9]|1[0-2])\/(\d{2})$/.test(card.exp) && card.cvc.length >= 3;

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.greeting}>Payment</div>
            <div className={styles.roleBadge}>{title}</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={()=>navigate(-1)}>Back</button>
          </div>
        </div>
      </div>

      <div className={styles.centerRow}>
        {description && (
          <div className={styles.listGroup}>
            <div className={styles.listItem}><span className={styles.listText}>{description}</span></div>
          </div>
        )}
        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <span className={styles.listText} style={{fontWeight:900}}>Amount</span>
            <span className={styles.listText}>
              {currency} {amountMajor}
            </span>
          </div>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}><span className={styles.listText} style={{fontWeight:900}}>Pay with card</span></div>
          <div className={styles.listItem}>
            <input className={styles.searchInput} placeholder="Card number" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} />
          </div>
          <div className={styles.listItem}>
            <input className={styles.searchInput} placeholder="MM/YY" value={card.exp} onChange={e=>setCard({...card, exp:e.target.value})} />
          </div>
          <div className={styles.listItem}>
            <input className={styles.searchInput} placeholder="CVC" value={card.cvc} onChange={e=>setCard({...card, cvc:e.target.value})} />
          </div>
        </div>

        <div className={styles.actionRow}>
          <button className={styles.primaryBtn} disabled={!cardOk} onClick={()=>{ alert("Demo: payment method captured (no charge made)"); navigate("/home"); }}>Pay</button>
        </div>
      </div>
    </section>
  );
}

