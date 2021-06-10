import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import asset2 from "../images/asset2.svg";

export default function Dashboard() {
  const controller = useSelector((state) => state.controller);
  const [mintedTokens, setMintedTokens] = useState([]);

  useEffect(() => {
    (async () => {
      const tokens = await controller.getUserMintedTokens();
      setMintedTokens(tokens);
    })();
  }, []);

  return (
    <section>
      <div className="inner">
        <h1>Dashboard</h1>
        <div className="holdings bottom-border">
          <h2>Holdings</h2>
          <div className="sysvalue">
            203,500<span className="decimal">.866544444</span> <em>SYS</em>
          </div>
        </div>
        <div className="assets">
          {Array.from({ length: 10 }).map((e, i) => (
            <div className="asset" key={i}>
              <embed src={asset2} />
              <div className="balance">
                343,455<span className="decimal">.866544444</span>
              </div>
              <div className="symbol">XYZ</div>
              <div className="asset-id">Asset ID: 234234235235</div>
              <div className="nft-id">NFT ID: 4324234234242</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}