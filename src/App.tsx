import { Layout } from "antd";
import "antd/dist/antd.less";
import "./app.less";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Switch, Route, HashRouter, useLocation } from "react-router-dom";
import { examples } from "./foundation/examples";
import { Tooltip } from "./components/tooltip/Tooltip";
import { AdvancedTooltip } from "./components/advancedTooltip/AdvancedTooltip";
import "@foxitsoftware/foxit-pdf-sdk-for-web-library/lib/UIExtension.vw.css";

import {
  hello,
  form,
  annotation,
  redaction,
  editPdf,
  digital_signature,
  search,
} from "./scenes";

const { Content } = Layout;

const App = () => {
  const iframeRef = useRef<any>(null);
  const locationDom = useLocation();
  const [isShow, setIsShow] = useState(true);
  const [current, setCurrent] = useState<number>(0);
  const [isDoneScene, changeDone] = useState<boolean>(true);
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [scene, setScene] = useState<any>(hello);
  const [locationTooltipX, setLocationTooltipX] = useState<string>("");
  const [locationTooltipY, setLocationTooltipY] = useState<string>("");
  const [screenSize, setScreenSize] = useState<string>("desktop");
  const getMessage = (event: any) => {
    let Data;
    try {
      Data = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    if (Data.hasOwnProperty("isTurn")) {
      setIsShow(Data.isTurn);
    }
    if (Data.screenSize) {
      setScreenSize(Data.screenSize);
      if(Data.screenSize !== "desktop"){
        setIsSuccess(false)
      }else{
        window.location.reload()
      }
      iframeRef.current.contentWindow.location.reload();
    }
  };

  useEffect(() => {
    window.addEventListener("message", getMessage, false);
    return () => {
      window.addEventListener("message", getMessage, false);
    };
  }, [iframeRef, location.hash]);

  const getElement = (newCurrent: number) => {
    setIsSuccess(true);

    getOffset(
      iframeRef.current.contentDocument.getElementsByName(
        scene[newCurrent].elementName
      )
    );
  };

  const handleNext = () => {
    setCurrent((prevCurrent) => {
      const newCurrent = prevCurrent + 1;
      scene[newCurrent].func(iframeRef);
      getElement(newCurrent);
      return newCurrent;
    });
  };

  const handlePrev = () => {
    setCurrent((prevCurrent) => {
      const newCurrent = prevCurrent - 1;
      scene[newCurrent].func(iframeRef);
      getElement(newCurrent);
      return newCurrent;
    });
  };
  const handleThisFunc = () => {
    scene[current].func(iframeRef);
  };

  const exportInf = () => {
    const example = iframeRef.current.contentWindow.__example__;
    return example.exportData()
  };

  const getOffset = (el: any) => {
    if (el.length) {
      const {left,top} = el[0].getBoundingClientRect();
      const {scrollX,scrollY,innerWidth} = window;
      const {sideTriangle,positionX,positionY,offsetX=0,offsetY=0} = scene[current];
      const rectLeft = Number(positionX.slice(0,-2));
      const rectTop = Number(positionY.slice(0,-2));
      switch (sideTriangle) {
        case 'right':
          setLocationTooltipX(`${left + scrollX - 316}px`);
          setLocationTooltipY(`${top + scrollY - 180}px`);
          break;
        case 'right-custom':
          setLocationTooltipX(`${innerWidth - rectLeft - 280}px`);
          setLocationTooltipY(`${rectTop}px`);
          break;
        case 'left-fixed':
          setLocationTooltipX(`${left + scrollX + 70}px`);
          setLocationTooltipY(`${top + scrollY - 85}px`);
          break;
        default:
          left + scrollX === 0
          ? setLocationTooltipX(`${left + scrollX}px`)
          : setLocationTooltipX(`${left + scrollX - Number(offsetX) - 100}px`);
          setLocationTooltipY(`${top + scrollY - Number(offsetY) + 40}px`);
          break;
      }
      return {
        left: left + scrollX,
        top: top + scrollY,
      };
    }
  };

  const handleDone = useCallback(() => {
    changeDone(false);
  }, []);

  useEffect(() => {
    switch (locationDom.hash) {
      case "#/hello": {
        setScene(hello);
        break;
      }
      case "#/annotation": {
        setScene(annotation);
        break;
      }
      case "#/forms": {
        setScene(form);
        break;
      }
      case "#/redaction": {
        setScene(redaction);
        break;
      }
      case "#/edit_pdfs": {
        setScene(editPdf);
        break;
      }
      case "#/digital_signature": {
        setScene(digital_signature);
        break;
      }
      case "#/search": {
        setScene(search);
        break;
      }
    }
  }, [locationDom.hash]);

  useEffect(() => {
    getElement(current);
  }, [current]);

  useEffect(() => {
    changeDone(true);
    setIsLoad(false);
    setIsSuccess(false);
    setCurrent(0);
  }, [locationDom.hash]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow.pdfui) {
      iframeRef.current.contentWindow.pdfui.addViewerEventListener(
        "open-file-success",
        () => {
          
          getElement(current);
        }
      );
    }
  }, [isLoad, screenSize]);

  return (
    <HashRouter>
        <Layout className="fv__catalog-app-body">
            <Content>
              <Switch>
                {examples.map((it) => {
                  return (
                    <Route path={"/" + it.baseName} key={it.name}>
                      {isShow &&
                        isDoneScene &&
                        isSuccess &&
                        locationDom.hash !== "#/advanced_form" &&
                        screenSize === "desktop" && (
                          <Tooltip
                            positionX={
                              scene[current].sideTriangle === "top" ||
                              scene[current].sideTriangle === "right" ||
                              scene[current].sideTriangle === "right-custom"
                                ? locationTooltipX
                                : scene[current].positionX
                            }
                            positionY={
                              scene[current].sideTriangle === "top" ||
                              scene[current].sideTriangle === "right" ||
                              scene[current].sideTriangle === "right-custom"
                                ? locationTooltipY
                                : scene[current].positionY
                            }
                            sideTriangle={scene[current].sideTriangle}
                            header={scene[current].header}
                            isRotate={scene[current].header === "Rotate pages"}
                            isMove={scene[current].header === "Reorder pages"}
                            description={scene[current].description}
                            isFirst={Boolean(current)}
                            isLast={scene.length - 1 === current}
                            handleNext={handleNext}
                            handlePrev={handlePrev}
                            handleDone={handleDone}
                            handleThisFunc={handleThisFunc}
                          />
                        )}
                      {locationDom.hash === "#/advanced_form" &&
                        isShow &&
                        isSuccess &&
                        screenSize === "desktop" && (
                          <AdvancedTooltip
                            header="Save your form data"
                            description="Download your partially-filled form data as HTML to save your place, and pick it up again later."
                            positionY="0px"
                            positionX="70px"
                            exportInf={exportInf}
                          />
                        )}

                      <iframe
                        onLoad={() => {
                          setIsLoad(true);
                        }}
                        ref={iframeRef}
                        className="fv__catalog-app-previewer"
                        src={it.path}
                      ></iframe>
                    </Route>
                  );
                })}
              </Switch>
            </Content>
          </Layout>
    </HashRouter>
  );
};

export default App;