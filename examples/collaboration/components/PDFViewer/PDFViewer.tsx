import React, { Component } from 'react';
import collaborationToolbar from './CollabToobar/CollaborationToolbar.art';
// @ts-ignore
import * as UIExtension from "UIExtension";
import "@foxitsoftware/foxit-pdf-sdk-for-web-library-full/lib/UIExtension.vw.css";
import mobileAddons from "@foxitsoftware/foxit-pdf-sdk-for-web-library-full/lib/uix-addons/allInOne.mobile"
import Addons from "@foxitsoftware/foxit-pdf-sdk-for-web-library-full/lib/uix-addons/allInOne"
import { PUBLIC_PATH,licenseSN,licenseKey } from "../../config";
import { message } from 'antd';
import {lang} from '../../locales';

interface IProps {
  onFinishInitPDFUI: Function;
  openFileSuccess:Function;
  onRequestAnnotPermissions: (annot: any) => Promise<String[]>;
  showLoading:Function;
}
export default class PDFViewer extends Component<IProps, any> {
  constructor(props: IProps) {
    super(props)
    this.state = {
    }
  }
  componentDidMount() {
    this.props.showLoading(true)
    this.initPDFUI()
  }
  componentWillUnmount() {
    this.state['pdfui'] && this.state['pdfui'].destroy();
  }
  initPDFUI() {
    const libPath = PUBLIC_PATH + "lib/";
    const PDFUI = UIExtension.PDFUI;
    // eventEm
    const pdfui = new PDFUI({
      viewerOptions: {
        libPath,
        jr: {
          workerPath: libPath,
          enginePath: libPath + "jr-engine/gsdk/",
          fontPath: "https://webpdf.foxitsoftware.com/webfonts/",
          licenseSN: licenseSN,
          licenseKey: licenseKey,
        },
        customs: {
          getAnnotPermissions: this.props.onRequestAnnotPermissions,
          isAttachFileOverSize: (file:any) => {
            if (!file) {
              return
            }
            if (file.size > 1024 * 1024 * 10) {
              message.error(lang.Component.sizeTip)
              return true
            }
          },
        }
      },
      renderTo: '#pdf-ui',
      appearance: UIExtension.appearances.adaptive,
      fragments: [],
      addons: UIExtension.PDFViewCtrl.DeviceInfo.isMobile ? mobileAddons : Addons,
    });
    pdfui.getRootComponent().then((root: any) => {
      // Hide Default Toolbar
      if(UIExtension.PDFViewCtrl.DeviceInfo.isMobile){
        const mobileHeaderRight=root.getComponentByName('fv--mobile-header-right')
        const peotectToolbar=root.getComponentByName('fv--mobile-header-main')
        const toolbarTabs = root.getComponentByName('fv--mobile-toolbar-tabs');
        toolbarTabs && toolbarTabs.hide();
        peotectToolbar&& peotectToolbar.hide()
        mobileHeaderRight&& mobileHeaderRight.hide()
        let collabComponent = root.getComponentByName('collaboration-toolbar');
        if (!collabComponent) {
          root.insert(collaborationToolbar(), 1);
          collabComponent = root.getComponentByName('collaboration-toolbar');
        }
        root.getComponentByName('sidebar').element.firstChild.childNodes[3].childNodes[4].style.display = "none";
      }else{
        const toolbarTabs = root.getComponentByName('toolbar');
        toolbarTabs && toolbarTabs.hide();
        let collabComponent = root.getComponentByName('collaboration-toolbar');
        if (!collabComponent) {
          root.insert(collaborationToolbar(), 1);
          collabComponent = root.getComponentByName('collaboration-toolbar');
        }
      }
    });
    pdfui.addUIEventListener(UIExtension.UIEvents.initializationCompleted, () => {
      this.props.onFinishInitPDFUI(pdfui);
    })
    pdfui.addUIEventListener(UIExtension.UIEvents.openFileSuccess, async () => {
      this.props.openFileSuccess();
    })
    this.setState({
      pdfui
    })
    window.onresize = function () {
      pdfui.redraw().catch(function () { });
    }
  }
  render() {
    return (<div id="pdf-ui"></div>)
  }
}
